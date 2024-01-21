import { formatWithOptions } from "util";

interface OrthographyRule {
  pattern: RegExp;
  replacement: string;
}

export function makeCandidatesFromRules(
  word: string,
  suffix: string,
  check: (candidate: string) => boolean = () => true
): string[] {
  const candidates: string[] = [];

  for (const rule of OrthographyRulesSingleton.getInstance().getOrthographyRules()) {
      const match = rule.pattern.exec(`${word} ^ ${suffix}`);
      if (match) {
          const expanded = match[0].replace(rule.pattern, rule.replacement);
          if (check(expanded)) {
              candidates.push(expanded);
          }
      }
  }

  return candidates;
}

class OrthographyRulesSingleton {
  private static instance: OrthographyRulesSingleton | null = null;
  private orthographyRules: OrthographyRule[] | null = null;

  private constructor() {
      // Private constructor to prevent instantiation
  }

  public static getInstance(): OrthographyRulesSingleton {
      if (!OrthographyRulesSingleton.instance) {
          OrthographyRulesSingleton.instance = new OrthographyRulesSingleton();
      }

      return OrthographyRulesSingleton.instance;
  }

  public getOrthographyRules(): OrthographyRule[] {
      if (!this.orthographyRules) {
          this.orthographyRules = this.initializeOrthographyRules();
      }

      return this.orthographyRules;
  }

  private initializeOrthographyRules(): OrthographyRule[] {
      // Your initialization logic here, e.g., mapping from existing rules
      return ORTHOGRAPHY_RULES.map(([pattern, replacement]) => ({ pattern, replacement }));
  }
}

const ORTHOGRAPHY_RULES: [RegExp, string][] = [
  // == +ly ==
  // artistic + ly = artistically
  [/^(.*[aeiou]c) \^ ly$/, '$1ally'],
  // humble + ly = humbly (*humblely)
  // questionable +ly = questionably
  // triple +ly = triply
  [/(.+[aeioubmnp])le \^ ly$/, '$1ly'],

  // == +ry ==
  // statute + ry = statutory
  [/^(.*t)e \^ (ry|ary)$/, '$1ory'],
  // confirm +tory = confirmatory (*confirmtory)
  [/(.+)m \^ tor(y|ily)$/, '$1mator$2'],
  // supervise +ary = supervisory (*supervisary)
  [/(.+)se \^ ar(y|ies)$/, '$1sor$2'],

  // == t +cy ==
  // frequent + cy = frequency (tcy/tecy removal)
  [/^(.*[naeiou])te? \^ cy$/, '$1cy'],

  // == +s ==
  // establish + s = establishes (sibilant pluralization)
  [/^(.*(?:s|sh|x|z|zh)) \^ s$/, '$1es'],
  // speech + s = speeches (soft ch pluralization)
  [/^(.*(?:oa|ea|i|ee|oo|au|ou|l|n|(?<![gin]a)r|t)ch) \^ s$/, '$1es'],
  // cherry + s = cherries (consonant + y pluralization)
  [/(.+[bcdfghjklmnpqrstvwxz])y \^ s$/, '$1ies'],

  // == y ==
  // die+ing = dying
  [/(.+)ie \^ ing$/, '$1ying'],
  // metallurgy + ist = metallurgist
  [/(.+[cdfghlmnpr])y \^ ist$/, '$1ist'],
  // beauty + ful = beautiful (y -> i)
  [/(.+[bcdfghjklmnpqrstvwxz])y \^ ([a-hj-xz].*)$/, '$1i$2'],

  // == +en ==
  // write + en = written
  [/(.+)te \^ en$/, '$1tten'],
  // Minessota +en = Minessotan (*Minessotaen)
  [/(.+[ae]) \^ e(n|ns)$/, '$1$2'],

  // == +ial ==
  // ceremony +ial = ceremonial (*ceremonyial)
  [/(.+)y \^ (ial|ially)$/, '$1$2'],
  // == +if ==
  // spaghetti +ification = spaghettification (*spaghettiification)
  [/(.+)i \^ if(y|ying|ied|ies|ication|ications)$/, '$1if$2'],

  // == +ical ==
  // fantastic +ical = fantastical (*fantasticcal)
  [/(.+)ic \^ (ical|ically)$/, '$1$2'],
  // epistomology +ical = epistomological
  [/(.+)ology \^ ic(al|ally)$/, '$1ologic$2'],
  // oratory +ical = oratorical (*oratoryical)
  [/(.*)ry \^ ica(l|lly|lity)$/, '$1rica$2'],

  // == +ist ==
  // radical +ist = radicalist (*radicallist)
  [/(.*[l]) \^ is(t|ts)$/, '$1is$2'],

  // == +ity ==
  // complementary +ity = complementarity (*complementaryity)
  [/(.*)ry \^ ity$/, '$1rity'],
  // disproportional +ity = disproportionality (*disproportionallity)
  [/(.*)l \^ ity$/, '$1lity'],

  // == +ive, +tive ==
  // perform +tive = performative (*performtive)
  [/(.+)rm \^ tiv(e|ity|ities)$/, '$1rmativ$2'],
  // restore +tive = restorative
  [/(.+)e \^ tiv(e|ity|ities)$/, '$1ativ$2'],

  // == +ize ==
  // token +ize = tokenize (*tokennize)
  // token +ise = tokenise (*tokennise)
  [/(.+)y \^ iz(e|es|ing|ed|er|ers|ation|ations|able|ability)$/, '$1iz$2'],
  [/(.+)y \^ is(e|es|ing|ed|er|ers|ation|ations|able|ability)$/, '$1is$2'],
  // conditional +ize = conditionalize (*conditionallize)
  [/(.+)al \^ iz(e|ed|es|ing|er|ers|ation|ations|m|ms|able|ability|abilities)$/, '$1aliz$2'],
  [/(.+)al \^ is(e|ed|es|ing|er|ers|ation|ations|m|ms|able|ability|abilities)$/, '$1alis$2'],
  // spectacular +ization = spectacularization (*spectacularrization)
  [/(.+)ar \^ iz(e|ed|es|ing|er|ers|ation|ations|m|ms)$/, '$1ariz$2'],
  [/(.+)ar \^ is(e|ed|es|ing|er|ers|ation|ations|m|ms)$/, '$1aris$2'],

  // category +ize/+ise = categorize/categorise (*categoryize/*categoryise)
  // custom +izable/+isable = customizable/customisable (*custommizable/*custommisable)
  // fantasy +ize = fantasize (*fantasyize)
  [/(.*[lmnty]) \^ iz(e|es|ing|ed|er|ers|ation|ations|m|ms|able|ability|abilities)$/, '$1iz$2'],
  [/(.*[lmnty]) \^ is(e|es|ing|ed|er|ers|ation|ations|m|ms|able|ability|abilities)$/, '$1is$2'],

  // == +olog ==
  // criminal + ology = criminology
  // criminal + ologist = criminalogist (*criminallologist)
  [/(.+)al \^ olog(y|ist|ists|ical|ically)$/, '$1olog$2'],

  // == +ish ==
  // similar +ish = similarish (*similarrish)
  [/(.+)(ar|er|or) \^ ish$/, '$1$2ish'],

  // free + ed = freed
  [/(.+e)e \^ (e.+)$/, '$1$2'],
  // narrate + ing = narrating (silent e)
  [/(.+[bcdfghjklmnpqrstuvwxz])e \^ ([aeiouy].*)$/, '$1$2'],

  // == misc ==
  // defer + ed = deferred (consonant doubling)   XXX monitor(stress not on last syllable)
  [/(.*(?:[bcdfghjklmnprstvwxyz]|qu)[aeiou])([bcdfgklmnprtvz]) \^ ([aeiouy].*)$/, '$1$2$2$3'],
];

const REVERSE_ORTHOGRAPHY_RULES: [RegExp, string][] = [
  // == +ly ==
  // artistic + ly = artistically
  [/^(.*[aeiou]c)ally$/, '$1'], // [/^(.*[aeiou]c) \^ ly$/, '$1ally'],
  // humble + ly = humbly (*humblely)
  // questionable +ly = questionably
  // triple +ly = triply
  [/^(.+[aeioubmnp])ly$/, '$1le'],  // [/(.+[aeioubmnp])le \^ ly$/, '$1ly'],

  // == +ry ==
  // statute + ry = statutory
  [/^(.*)ory$/, '$1t'], // [/^(.*t)e \^ (ry|ary)$/, '$1ory'],
  // confirm +tory = confirmatory (*confirmtory)
  [/^(.*)mator(.*)$/, '$1m'], // [/(.+)m \^ tor(y|ily)$/, '$1mator$2'],
  // supervise +ary = supervisory (*supervisary)
  [/^(.*)sor(.*)$/, '$1se'], // [/(.+)se \^ ar(y|ies)$/, '$1sor$2'],

  // == t +cy ==
  // frequent + cy = frequency (tcy/tecy removal)
  [/^(.*[naeiou])cy$/, '$1t'], // [/^(.*[naeiou])te? \^ cy$/, '$1cy'],

  // == +s ==
  // establish + s = establishes (sibilant pluralization)
  [/^(.*(?:s|sh|x|z|zh))es$/, '$1'], // [/^(.*(?:s|sh|x|z|zh)) \^ s$/, '$1es'],
  // speech + s = speeches (soft ch pluralization)
  // Same as above
  // cherry + s = cherries (consonant + y pluralization)
  [/^(.+[bcdfghjklmnpqrstvwxz])ies$/, '$1y'], // [/(.+[bcdfghjklmnpqrstvwxz])y \^ s$/, '$1ies'],

  // == y ==
  // die+ing = dying
  [/^(.*)ying$/, '$1ie'], // [/(.+)ie \^ ing$/, '$1ying'],
  // metallurgy + ist = metallurgist
  [/^(.+[cdfghlmnpr])ist$/, '$1y'], // [/(.+[cdfghlmnpr])y \^ ist$/, '$1ist'],
  // beauty + ful = beautiful (y -> i)
  [/^(.+[bcdfghjklmnpqrstvwxz])i([a-hj-xz].*)$/, '$1y'], // [/(.+[bcdfghjklmnpqrstvwxz])y \^ ([a-hj-xz].*)$/, '$1i$2'],

  // == +en ==
  // write + en = written
  [/^(.+)tten$/, '$1te'], // [/(.+)te \^ en$/, '$1tten'],
  // Minessota +en = Minessotan (*Minessotaen)
  [/^(.+[ae])(n|ns)$/, '$1'], // [/(.+[ae]) \^ e(n|ns)$/, '$1$2'],

  // == +ial ==
  // ceremony +ial = ceremonial (*ceremonyial)
  [/^(.+)(ial|ially)$/, '$1y'], // [/(.+)y \^ (ial|ially)$/, '$1$2'],
  // == +if ==
  // spaghetti +ification = spaghettification (*spaghettiification)
  [/^(.+)if(y|ying|ied|ies|ication|ications)$/, '$1i'], // [/(.+)i \^ if(y|ying|ied|ies|ication|ications)$/, '$1if$2'],

  // == +ical ==
  // fantastic +ical = fantastical (*fantasticcal)
  [/^(.+)(ical|ically)$/, '$1'], // [/(.+)ic \^ (ical|ically)$/, '$1$2'],
  // epistomology +ical = epistomological
  [/^(.+)ologic(al|ally)$/, '$1ology'], // [/(.+)ology \^ ic(al|ally)$/, '$1ologic$2'],
  // oratory +ical = oratorical (*oratoryical)
  [/^(.*)rica(l|lly|lity)$/, '$1ry'], // [/(.*)ry \^ ica(l|lly|lity)$/, '$1rica$2'],

  // == +ist ==
  // radical +ist = radicalist (*radicallist)
  [/^(.*[l])is(t|ts)$/, '$1'], // [/(.*[l]) \^ is(t|ts)$/, '$1is$2'],

  // == +ity ==
  // complementary +ity = complementarity (*complementaryity)
  [/^(.*)rity$/, '$1ry'], // [/(.*)ry \^ ity$/, '$1rity'],
  // disproportional +ity = disproportionality (*disproportionallity)
  [/^(.*)lity$/, '$1l'], // [/(.*)l \^ ity$/, '$1lity'],

  // == +ive, +tive ==
  // perform +tive = performative (*performtive)
  [/^(.+)rmativ(e|ity|ities)$/, '$1rm'], // [/(.+)rm \^ tiv(e|ity|ities)$/, '$1rmativ$2'],
  // restore +tive = restorative
  [/^(.+)ativ(e|ity|ities)$/, '$1e'], // [/(.+)e \^ tiv(e|ity|ities)$/, '$1ativ$2'],

  // == +ize ==
  // token +ize = tokenize (*tokennize)
  // token +ise = tokenise (*tokennise)
  [/^(.+)iz(e|es|ing|ed|er|ers|ation|ations|able|ability)$/, '$1y'], // [/(.+)y \^ iz(e|es|ing|ed|er|ers|ation|ations|able|ability)$/, '$1iz$2'],
  [/^(.+)is(e|es|ing|ed|er|ers|ation|ations|able|ability)$/, '$1y'], // [/(.+)y \^ is(e|es|ing|ed|er|ers|ation|ations|able|ability)$/, '$1is$2'],
  // conditional +ize = conditionalize (*conditionallize)
  [/^(.+)iz(e|ed|es|ing|er|ers|ation|ations|m|ms|able|ability|abilities)$/, '$1al'], // [/(.+)al \^ iz(e|ed|es|ing|er|ers|ation|ations|m|ms|able|ability|abilities)$/, '$1aliz$2'],
  [/^(.+)is(e|ed|es|ing|er|ers|ation|ations|m|ms|able|ability|abilities)$/, '$1al'], // [/(.+)al \^ is(e|ed|es|ing|er|ers|ation|ations|m|ms|able|ability|abilities)$/, '$1alis$2'],
  // spectacular +ization = spectacularization (*spectacularrization)
  [/^(.+)$/, ''], // [/(.+)ar \^ iz(e|ed|es|ing|er|ers|ation|ations|m|ms)$/, '$1ariz$2'],
  [/^(.+)$/, ''], // [/(.+)ar \^ is(e|ed|es|ing|er|ers|ation|ations|m|ms)$/, '$1aris$2'],

  // category +ize/+ise = categorize/categorise (*categoryize/*categoryise)
  // custom +izable/+isable = customizable/customisable (*custommizable/*custommisable)
  // fantasy +ize = fantasize (*fantasyize)
  [/^$/, ''], // [/(.*[lmnty]) \^ iz(e|es|ing|ed|er|ers|ation|ations|m|ms|able|ability|abilities)$/, '$1iz$2'],
  [/^$/, ''], // [/(.*[lmnty]) \^ is(e|es|ing|ed|er|ers|ation|ations|m|ms|able|ability|abilities)$/, '$1is$2'],

  // == +olog ==
  // criminal + ology = criminology
  // criminal + ologist = criminalogist (*criminallologist)
  [/^$/, ''], // [/(.+)al \^ olog(y|ist|ists|ical|ically)$/, '$1olog$2'],

  // == +ish ==
  // similar +ish = similarish (*similarrish)
  [/^$/, ''], // [/(.+)(ar|er|or) \^ ish$/, '$1$2ish'],

  // free + ed = freed
  [/^$/, ''], // [/(.+e)e \^ (e.+)$/, '$1$2'],
  // narrate + ing = narrating (silent e)
  [/^$/, ''], // [/(.+[bcdfghjklmnpqrstuvwxz])e \^ ([aeiouy].*)$/, '$1$2'],

  // == misc ==
  // defer + ed = deferred (consonant doubling)   XXX monitor(stress not on last syllable)
  [/^$/, ''], // [/(.*(?:[bcdfghjklmnprstvwxyz]|qu)[aeiou])([bcdfgklmnprtvz]) \^ ([aeiouy].*)$/, '$1$2$2$3'],
];