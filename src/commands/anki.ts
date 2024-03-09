export type Args = {
  dictionary: any,
  popularity: any
};

export async function runAnkiGeneration(args: Args) {
  console.log(JSON.stringify(args, null,2 ));
}