import Section from "./section";
import { info, socials } from "@/lib/data/personal";
import Link from "next/link";

export default function About() {
    return (
        <Section title="About">
            <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground">{info.description}</p>

                <div className="pt-2 text-sm text-muted-foreground">
                    <p>
                        Want to link up?{" "}
                        <Link
                            href={`mailto:${socials.email}`}
                            className="font-medium text-primary hover:underline"
                        >
                            Get in touch at {socials.email}
                        </Link>
                    </p>
                </div>
            </div>
        </Section>
    );
}