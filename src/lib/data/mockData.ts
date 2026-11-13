/** Everything a portfolio template needs. Built from the database by loadPortfolio(). */
export interface PortfolioProject {
    id: string | number;
    title: string;
    description: string;
    tags: string[];
    /** Live/demo URL */
    link: string;
    repoUrl?: string;
    visible?: boolean;
}

export interface PortfolioExperience {
    id: string | number;
    role: string;
    company: string;
    /** Display text, e.g. "Jun 2024 - Present" */
    period: string;
    description: string;
    /** YYYY-MM, used by the editor */
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    location?: string;
    visible?: boolean;
}

export interface PortfolioEducation {
    id: string | number;
    institution: string;
    degree: string;
    field?: string;
    period: string;
    startDate?: string;
    endDate?: string;
    grade?: string;
}

export interface PortfolioData {
    name: string;
    email: string;
    title: string;
    bio: string;
    location: string;
    avatarUrl?: string;
    phone?: string;
    website?: string;
    showEmail?: boolean;
    showPhone?: boolean;
    socials: {
        github: string;
        linkedin: string;
        email: string;
        twitter?: string;
    };
    skills: {
        frontend: string[];
        backend: string[];
        tools: string[];
    };
    projects: PortfolioProject[];
    experience: PortfolioExperience[];
    education?: PortfolioEducation[];
}

export const portfolioData: PortfolioData = {
    name: "Alex Dev",
    email: "alex@example.com",
    title: "Senior Full Stack Developer",
    bio: "Passionate about building scalable web applications and intuitive user experiences. Specialized in React, Node.js, and cloud architecture.",
    location: "San Francisco, CA",
    socials: {
        github: "https://github.com",
        linkedin: "https://linkedin.com",
        email: "mailto:alex@example.com"
    },
    skills: {
        frontend: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
        backend: ["Node.js", "PostgreSQL", "GraphQL", "Redis"],
        tools: ["Git", "Docker", "AWS", "Figma"]
    },
    projects: [
        {
            id: 1,
            title: "E-commerce Platform",
            description: "A full-stack e-commerce solution with Next.js and Stripe. Features include real-time inventory, secure checkout, and admin dashboard.",
            tags: ["Next.js", "TypeScript", "Stripe"],
            link: "#"
        },
        {
            id: 2,
            title: "Task Management App",
            description: "Real-time collaboration tool for remote teams. specialized for agile workflows with Kanban boards and sprint planning.",
            tags: ["React", "Firebase", "Tailwind"],
            link: "#"
        },
        {
            id: 3,
            title: "Fitness Tracker API",
            description: "RESTful API for tracking workouts and nutrition. Built with scalability in mind using microservices architecture.",
            tags: ["Node.js", "Express", "PostgreSQL"],
            link: "#"
        }
    ],
    experience: [
        {
            id: 1,
            role: "Senior Frontend Developer",
            company: "TechCorp Inc.",
            period: "2022 - Present",
            description: "Leading the frontend migration to Next.js and implementing a new design system. Improved site performance by 40%."
        },
        {
            id: 2,
            role: "Full Stack Engineer",
            company: "StartupX",
            period: "2020 - 2022",
            description: "Built scalable APIs and interactive UI for a fintech product. Mentored junior developers and established code quality standards."
        }
    ]
};

