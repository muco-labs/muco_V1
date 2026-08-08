export const organizationGrowthStages = [
  {
    id: 'stage_1_founder_led',
    label: 'Stage 1 — Founder-led',
    maxEmployees: 1,
  },
  {
    id: 'stage_2_core_team',
    label: 'Stage 2 — Small core team',
    maxEmployees: 8,
  },
  {
    id: 'stage_3_department_leads',
    label: 'Stage 3 — Department leads',
    maxEmployees: 25,
  },
  {
    id: 'stage_4_management',
    label: 'Stage 4 — Management layer',
    maxEmployees: 60,
  },
  {
    id: 'stage_5_multi_team',
    label: 'Stage 5 — Multi-team organization',
    maxEmployees: Number.POSITIVE_INFINITY,
  },
] as const

export function inferGrowthStage(activeEmployeeCount: number): (typeof organizationGrowthStages)[number]['id'] {
  const count = Math.max(0, activeEmployeeCount)
  for (const stage of organizationGrowthStages) {
    if (count <= stage.maxEmployees) return stage.id
  }
  return 'stage_5_multi_team'
}
