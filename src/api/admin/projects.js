import { mock } from "../client";

const PROJECTS = [
  { id: "pr1", title: "Elizabeth Line Quarter", image: "/images/work/one-maidenhead.jpg", description: "A masterplan for the area surrounding Maidenhead station — retail, residential and public realm proposals shaping the town's future.", published: true, updatedAt: "2026-05-10" },
  { id: "pr2", title: "High Street Renewal", image: "/images/events/market.jpg", description: "Partnership programme to revitalise the town centre high street with independent retailers and improved pedestrian experience.", published: true, updatedAt: "2026-04-22" },
  { id: "pr3", title: "Green Corridors Initiative", image: "/images/events/duck-derby.jpg", description: "New cycle and walking routes connecting the town centre to the Thames Path and Ray Mill Island.", published: false, updatedAt: "2026-06-01" },
];

export function getProjects() {
  return mock(PROJECTS);
}

export function saveProject(project) {
  return mock({ ...project, id: project.id || `pr${Date.now()}`, updatedAt: new Date().toISOString().slice(0, 10) });
}

export function deleteProject(id) {
  return mock({ id, deleted: true });
}
