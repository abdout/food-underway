
import Hero from "./hero";
// import Stack from "./stack";
// import Testimonial from "./testimonial";
// import LetsWorkTogether from "./lets-work-together";
// import Wizard from "@/components/wizard";
// import Time from "./time";
// import Boost from "./boost";
// import OpenSource from "./open-source";
// import Automated from "@/components/automated/featured";
// import Codebase from "@/components/landing/codebase";
// import FAQs from "./faqs";
// import LogoCloud from "./logo-cloud";
// import { Gallery } from "@/components/landing/gallery";
import type { Dictionary } from '@/components/internationalization/dictionaries';
import type { Locale } from '@/components/internationalization/config';

interface HomeContentProps {
  dictionary?: Dictionary;
  lang?: Locale;
}

export default function HomeContent({ dictionary, lang }: HomeContentProps) {
  return (
    <main className="flex flex-col">
      <Hero dictionary={dictionary} lang={lang} />
      {/*<Gallery />*/}
      {/*<Stack />*/}
      {/*<Automated />*/}
      {/*<OpenSource /> */}
      {/* <Codebase /> */}
      {/*<Time dictionary={dictionary} />*/}
      {/* <Wizard /> */}
      {/*<Testimonial dictionary={dictionary} />*/}
      {/*<LogoCloud dictionary={dictionary} />*/}
      {/*<FAQs dictionary={dictionary} />*/}
      {/*<LetsWorkTogether dictionary={dictionary} />*/}
      {/*<Boost dictionary={dictionary} />*/}
    </main>
  );
}
