import { ilike, or, type SQL } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'
import { leads } from '../../db/schema.js'
import {
  ERODE_PAGE_PREFIX,
  INDIA_PAGE_PREFIX,
  INDIA_METRO_CITY_HINTS,
  INDIA_STATE_HINTS,
  TAMIL_NADU_CITY_HINTS,
  TAMIL_NADU_PAGE_PREFIX,
  TAMIL_NADU_STATE_HINTS,
} from './constants.js'

function textColumnIlike(column: PgColumn, hints: readonly string[]): SQL[] {
  return hints.map((hint) => ilike(column, `%${hint}%`))
}

export function erodeLeadCondition(): SQL {
  return or(
    ilike(leads.businessCity, '%erode%'),
    ilike(leads.landingPath, `${ERODE_PAGE_PREFIX}%`),
    ilike(leads.pageSource, '%erode%'),
    ilike(leads.referralSource, '%erode%'),
  )!
}

export function tamilNaduLeadCondition(): SQL {
  return or(
    ...textColumnIlike(leads.businessCity, TAMIL_NADU_CITY_HINTS),
    ...textColumnIlike(leads.businessState, TAMIL_NADU_STATE_HINTS),
    ilike(leads.landingPath, `${TAMIL_NADU_PAGE_PREFIX}%`),
    ilike(leads.pageSource, '%tamil%'),
  )!
}

export function indiaLeadCondition(): SQL {
  return or(
    tamilNaduLeadCondition(),
    ...textColumnIlike(leads.businessCity, INDIA_METRO_CITY_HINTS),
    ...textColumnIlike(leads.businessState, INDIA_STATE_HINTS),
    ilike(leads.landingPath, `${INDIA_PAGE_PREFIX}%`),
    ilike(leads.pageSource, 'india%'),
  )!
}
