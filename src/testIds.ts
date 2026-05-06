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
    forgotPasswordLink: 'login.forgotPasswordLink',
  },
  forgotPassword: {
    screen: 'screen.forgotPassword',
    emailInput: 'forgotPassword.emailInput',
    submitButton: 'forgotPassword.submitButton',
    confirmation: 'forgotPassword.confirmation',
  },
  otp: {
    screen: 'screen.otp',
    codeInput: 'otp.codeInput',
    submitButton: 'otp.submitButton',
    resendButton: 'otp.resendButton',
    resendCountdown: 'otp.resendCountdown',
    errorMessage: 'otp.errorMessage',
  },
  resetPassword: {
    screen: 'screen.resetPassword',
    newPasswordInput: 'resetPassword.newPasswordInput',
    confirmPasswordInput: 'resetPassword.confirmPasswordInput',
    submitButton: 'resetPassword.submitButton',
    errorMessage: 'resetPassword.errorMessage',
    successMessage: 'resetPassword.successMessage',
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
    promoInput: 'buyTicket.promoInput',
    promoApplyButton: 'buyTicket.promoApplyButton',
    promoSuccess: 'buyTicket.promoSuccess',
    promoError: 'buyTicket.promoError',
    totalAmount: 'buyTicket.totalAmount',
  },
} as const;
