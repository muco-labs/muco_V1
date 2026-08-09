export type ApplicationDomain =
  | 'public'
  | 'customer'
  | 'employee'
  | 'freelancer'
  | 'admin'
  | 'unknown'

export type RoutingMode = 'path_prefix' | 'subdomain_root'

export type PortalKind = 'customer' | 'employee' | 'freelancer' | 'admin'
