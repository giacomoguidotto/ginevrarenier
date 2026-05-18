"use client";

import type { Doc } from "convex/_generated/dataModel";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/animations";
import { ProjectCard } from "./project-card";

type Project = Doc<"projects">;

export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <motion.div
      animate="visible"
      className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
      initial="hidden"
      variants={staggerContainer}
    >
      {projects.map((project, index) => (
        <ProjectCard index={index} key={project._id} project={project} />
      ))}
    </motion.div>
  );
}
