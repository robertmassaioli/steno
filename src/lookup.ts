import { isPresent } from "ts-is-present";
import * as protobuf from 'protobufjs';
import * as fs from 'fs/promises';
import * as path from 'path';

const prefixLooupPath = require.resolve('./proto/prefix-lookup.proto');

export type InputObject = Record<string, string>;
export type InvertedLookup = Record<string, string[]>;
export type PrefixLookup = Record<string, Array<PrefixMatch>>;
export type PrefixMatch = {
  stroke: string;
  fullText: string;
}

export function createLookup(inputObject: InputObject): InvertedLookup {
  const result: InvertedLookup = {};

  for (const [key, value] of Object.entries(inputObject)) {
    if (result.hasOwnProperty(value)) {
      result[value].push(key);
    } else {
      result[value] = [key];
    }
  }

  return result;
}

async function loadProtobufDefinition(protoFilePath: string): Promise<protobuf.Root> {
  return new Promise((resolve, reject) => {
    protobuf.load(protoFilePath, (err, root) => {
      if (err) {
        reject(err);
      } else if (isPresent(root)) {
        resolve(root);
      } else {
        reject(new Error(`There was no error but the root was undefined. That's a fail.`))
      }
    });
  });
}

async function ensureDirectoryExists(directoryPath: string): Promise<void> {
  try {
    await fs.mkdir(directoryPath, { recursive: true });
  } catch (error) {
    // Handle directory creation error if needed
    console.error('Error creating directory:', error);
  }
}

function genFilename(rawFilename: string) {
  if (/^[a-zA-Z0-9]+$/.test(rawFilename)) {
    return rawFilename;
  }

  return 'hex.' + Buffer.from(rawFilename).toString('base64');
}

export async function createPrefixLookupFS(input: Record<string, string>, directory: string): Promise<void> {
  // TODO load the protobuf
  const root = await loadProtobufDefinition(prefixLooupPath);
  const SegmentMatch = root.lookupType('SegmentMatch');
  const SegmentLookup = root.lookupType('SegmentLookup');

  let valuesAdded = 0;

  ensureDirectoryExists(directory);

  console.log(`Generating prefix lookup`);
  for (const [key, value] of Object.entries(input)) {
    const promises = new Array<Promise<void>>();
    for (let i = 1; i <= value.length; i++) {
      const prefix = value.slice(0, i);
      const suffix = value.slice(i - 1);

      const newData = SegmentLookup.create({
        matches: [SegmentMatch.create({
          stroke: key,
          fullText: value
        })]
      });

      const output = SegmentLookup.encode(newData).finish();
      // Turn the prefix to hexadecimal for the name if it contains any special characters?
      promises.push(fs.appendFile(path.join(directory, `${genFilename(prefix)}.prefix.bin`), output));
      promises.push(fs.appendFile(path.join(directory, `${genFilename(suffix)}.suffix.bin`), output));

      valuesAdded++;
      if (valuesAdded % 10000 === 0) {
        console.log(`Added ${valuesAdded} to the prefix lookups.`);
      }
    }
    await Promise.allSettled(promises);
  }

  console.log(`Generated prefix lookup. ${valuesAdded} values added.`);
}