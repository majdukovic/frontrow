import events from './events.json';
import users from './users.json';
import tickets from './tickets.json';
import artists from './artists.json';

import type { Artist, Event, Ticket, User } from '../../api/types';

type SeedUser = User & { password: string };

export const seed = {
  events: events as Event[],
  users: users as SeedUser[],
  tickets: tickets as Ticket[],
  artists: artists as Artist[],
};
