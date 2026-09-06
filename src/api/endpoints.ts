/**
 * Nomes de rota extraídos diretamente dos *.controller.ts do backend.
 * Mantidos num só lugar para: (1) servir de base literal das chamadas HTTP,
 * e (2) servir de "queryKey" do React Query (ver hooks em src/features).
 */
export const endpoints = {
  auth: {
    login: '/auth/login',
  },

  user: {
    base: '/user',
    me: '/user/me',
    mePassword: '/user/me/password',
    byId: (id: string) => `/user/${id}`,
  },

  motoboy: {
    base: '/motoboy',
    byId: (id: string) => `/motoboy/${id}`,
    createWithMotorcycle: (motorcycleId: string) => `/motoboy/${motorcycleId}`,
    meMotorcycle: '/motoboy/me/motorcycle',
    restrictMotorcycle: (id: string) => `/motoboy/motorcycle/restrict/${id}`,
  },

  motorcycle: {
    base: '/motorcycle',
    byId: (id: string) => `/motorcycle/${id}`,
  },

  place: {
    createMe: '/place/me',
    byId: (id: string) => `/place/${id}`,
    base: '/place',
    updateMeById: (id: string) => `/place/me/${id}`,
    updateCode: (id: string, code: string) => `/place/me/${id}/${code}`,
  },

  workTimePlace: {
    base: '/work-time-place',
    date: '/work-time-place/date',
    meById: (id: string) => `/work-time-place/me/${id}`,
  },

  workTimeUser: {
    byId: (id: string) => `/work-time-user/${id}`,
    shared: (userId: string, workTimeId: string) =>
      `/work-time-user/shared/${userId}/${workTimeId}`,
    meIntervalTime: '/work-time-user/me/interval-time',
    intervalTimeForEntity: (id: string) =>
      `/work-time-user/interval-time/${id}`,
  },

  workTime: {
    base: '/work-time',
    me: '/work-time/me',
    byId: (id: string) => `/work-time/${id}`,
  },

  intervalTime: {
    base: '/interval-time',
    me: '/interval-time/me',
    byId: (id: string) => `/interval-time/${id}`,
  },

  customer: {
    base: '/customer',
    find: '/customer/find',
    byId: (id: string) => `/customer/${id}`,
    address: (id: string) => `/customer/${id}/address`,
    addressById: (id: string) => `/customer/address/${id}`,
  },

  address: {
    base: '/address',
    byId: (id: string) => `/address/${id}`,
  },

  delivery: {
    me: '/delivery/me',
    meById: (id: string) => `/delivery/me/${id}`,
    base: '/delivery',
    byId: (id: string) => `/delivery/${id}`,
  },

  tip: {
    byId: (id: string) => `/tip/${id}`,
  },

  voucher: {
    me: '/voucher/me',
    meForUser: (userId: string) => `/voucher/me/user/${userId}`,
    meById: (id: string) => `/voucher/me/${id}`,
    meForUserById: (id: string) => `/voucher/me/user/${id}`,
    base: '/voucher',
    byId: (id: string) => `/voucher/${id}`,
  },

  payout: {
    preview: '/payout/preview',
    base: '/payout',
    me: '/payout/me',
    byId: (id: string) => `/payout/${id}`,
    code: (id: string) => `/payout/${id}/code`,
    flag: (id: string, flag: boolean) => `/payout/${id}/${flag}`,
  },

  settlement: {
    preview: '/settlement/preview',
    base: '/settlement',
    me: '/settlement/me',
    byId: (id: string) => `/settlement/${id}`,
    code: (id: string) => `/settlement/${id}/code`,
    flag: (id: string, flag: boolean) => `/settlement/${id}/${flag}`,
  },
} as const;
