import {
  concepts,
  languages,
  libraries,
  operatingSystems,
  tools,
} from "@/lib/data/skills";
import Section from "./section";

import { Badge } from "./ui/badge";

type SkillCategoryProps = {
  title: string;
  items: string[];
};

function SkillCategory({ title, items }: SkillCategoryProps) {
  return (
    <div>
      <p className="uppercase text-[10px] text-neutral-500 tracking-wider font-medium mb-2">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge
            key={item}
            variant="secondary"
            className="text-[10px] rounded-sm text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-800 border border-border/40"
          >
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function Skills() {
  const categories: SkillCategoryProps[] = [
    { title: "Languages", items: languages },
    { title: "Libraries", items: libraries },
    { title: "Tools", items: tools },
    { title: "Concepts", items: concepts },
    { title: "Operating Systems", items: operatingSystems },
  ];

  return (
    <Section title="SKILLS">
      <div className="pt-8 space-y-4">
        {categories.map((category) => (
          <SkillCategory
            key={category.title}
            title={category.title}
            items={category.items}
          />
        ))}
      </div>
    </Section>
  );
}
