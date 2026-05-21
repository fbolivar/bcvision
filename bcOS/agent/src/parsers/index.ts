import type { FirewallBrand, ParsedFirewallEvent, SyslogMessage } from '../types'
import { parsefortinet } from './fortinet'
import { parseCisco } from './cisco'
import { parsePfsense } from './pfsense'
import { parseSophos } from './sophos'
import { parsePaloAlto } from './paloalto'
import { parseMikrotik } from './mikrotik'
import { parseGeneric } from './generic'

type Parser = (msg: SyslogMessage) => ParsedFirewallEvent

const parsers: Record<FirewallBrand, Parser> = {
  fortinet:  parsefortinet,
  cisco:     parseCisco,
  pfsense:   parsePfsense,
  sophos:    parseSophos,
  paloalto:  parsePaloAlto,
  mikrotik:  parseMikrotik,
  generic:   parseGeneric,
}

export function getParser(brand: FirewallBrand): Parser {
  return parsers[brand] ?? parseGeneric
}
