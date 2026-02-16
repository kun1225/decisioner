import { pgEnum } from 'drizzle-orm/pg-core';

export const authProviderEnum = pgEnum('auth_provider', ['LOCAL', 'GOOGLE']);
export const exerciseSourceEnum = pgEnum('exercise_source', [
  'PRESET',
  'CUSTOM',
]);
export const sessionStatusEnum = pgEnum('session_status', [
  'IN_PROGRESS',
  'COMPLETED',
]);
export const sessionItemOriginEnum = pgEnum('session_item_origin', [
  'TEMPLATE',
  'REPLACED',
  'MANUAL',
]);
export const weightUnitEnum = pgEnum('weight_unit', ['KG', 'LB']);
export const friendStatusEnum = pgEnum('friend_status', [
  'PENDING',
  'ACCEPTED',
  'BLOCKED',
]);
export const crewRoleEnum = pgEnum('crew_role', ['OWNER', 'MEMBER']);
export const visibilityLevelEnum = pgEnum('visibility_level', [
  'PRIVATE',
  'FRIENDS',
  'PUBLIC',
]);
