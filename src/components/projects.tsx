import Image from "next/image";
import Link from "next/link";
import { projects } from "@/lib/data/projects";
import { Badge } from "./ui/badge";
import { GithubIcon, GlobeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function Projects() {
    return (
        <section className="w-full max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                    <article
                        key={project.title}
                        className="group flex flex-col overflow-hidden rounded-md border border-border bg-white dark:bg-black"
                    >
                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                            <Image
                                src={project.imageSrc}
                                alt={project.title}
                                fill
                                sizes="(min-width: 768px) 50vw, 100vw"
                                className="object-cover transition duration-300 group-hover:scale-105"
                            />
                        </div>

                        <div className="flex flex-1 flex-col gap-2 p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="text-sm font-semibold leading-tight">
                                        {project.title}
                                    </h3>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {project.description}
                                    </p>
                                </div>
                                {project.date && (
                                    <span className="shrink-0 text-[11px] text-muted-foreground">
                                        {project.date}
                                    </span>
                                )}
                            </div>

                            {project.tags && project.tags.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                    {project.tags.map((tag) => (
                                        <Badge key={tag} variant="outline" className="text-[10px]">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {(project.websiteUrl || project.githubUrl) && (
                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                    {project.websiteUrl && (
                                        <Link
                                            href={project.websiteUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                                        >
                                            <HugeiconsIcon icon={GlobeIcon} size={14} />
                                            <span>Live site</span>
                                        </Link>
                                    )}
                                    {project.githubUrl && (
                                        <Link
                                            href={project.githubUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                                        >
                                            <HugeiconsIcon icon={GithubIcon} size={14} />
                                            <span>Source</span>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
