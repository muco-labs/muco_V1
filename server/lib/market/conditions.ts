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
  INTERNATIONAL_PAGE_PREFIX,
  TIER1_MARKET_COUNTRY_HINTS,
  type Tier1MarketId,
} from './constants.js'

const ALL_TIER1_COUNTRY_HINTS = Object.values(TIER1_MARKET_COUNTRY_HINTS).flat()

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

export function internationalLeadCondition(): SQL {
  return or(
    ilike(leads.landingPath, `${INTERNATIONAL_PAGE_PREFIX}%`),
    ilike(leads.pageSource, 'international%'),
    ...textColumnIlike(leads.businessCountry, ALL_TIER1_COUNTRY_HINTS),
  )!
}

export function tier1MarketLeadCondition(market: Tier1MarketId): SQL {
  return or(...textColumnIlike(leads.businessCountry, TIER1_MARKET_COUNTRY_HINTS[market]))!
}
