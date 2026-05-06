/**
 * Single source of truth for all test IDs. Never hard-code an ID at a call site.
 * Convention: `<screen-or-area>.<element>[.<id>]`
 */
export const testIds = {
  app: {
    root: 'app.root',
  },
  tab: {
    events: 'tab.events',
    myTickets: 'tab.myTickets',
    profile: 'tab.profile',
    debug: 'tab.debug',
  },
  events: {
    screen: 'screen.events',
    list: 'events.list',
    item: (id: string) => `events.item.${id}`,
    searchInput: 'events.searchInput',
    filterButton: 'events.filterButton',
    errorMessage: 'events.errorMessage',
  },
  myTickets: {
    screen: 'screen.myTickets',
    list: 'myTickets.list',
    item: (id: string) => `myTickets.item.${id}`,
  },
  profile: {
    screen: 'screen.profile',
    avatar: 'profile.avatar',
    signInButton: 'profile.signInButton',
    signOutButton: 'profile.signOutButton',
  },
  login: {
    screen: 'screen.login',
    emailInput: 'login.emailInput',
    passwordInput: 'login.passwordInput',
    submitButton: 'login.submitButton',
  },
  debug: {
    screen: 'screen.debug',
    seedScenarioButton: (id: string) => `debug.seedScenario.${id}`,
    resetButton: 'debug.resetButton',
    timeTravelInput: 'debug.timeTravelInput',
    fakePushButton: 'debug.fakePushButton',
    forceErrorToggle: 'debug.forceErrorToggle',
    crashButton: 'debug.crashButton',
  },
  eventDetail: {
    screen: 'screen.eventDetail',
    title: 'eventDetail.title',
    buyButton: 'eventDetail.buyButton',
    favoriteButton: 'eventDetail.favoriteButton',
  },
  buyTicket: {
    screen: 'screen.buyTicket',
    quantityStepper: 'buyTicket.quantityStepper',
    payButton: 'buyTicket.payButton',
  },
} as const;
