const moment = require('moment');

/**
 * Parses relative date expressions like "now", "today", and "now-2d".
 * Supports operations like addition or subtraction of intervals.
 *
 * @param {string} value - The relative date expression.
 * @param {string} timeZone - The time zone offset (e.g., "+05:30").
 * @returns {string|null} - The formatted date string or null if the expression is invalid.
 */
function parseRelativeDate(value, timeZone) {
  const regex = /^(now|today)([+-]\d+[smhdwMy])?$/;
  const match = regex.exec(value);

  if (!match) {
    return null;
  }

  let baseDate = match[1] === 'now' ? moment() : moment().startOf('day');
  if (match[2]) {
    const interval = match[2].substring(1);
    const operation = match[2][0] === '+' ? 'add' : 'subtract';
    const unit = interval.slice(-1);
    const amount = parseInt(interval.slice(0, -1), 10);
    baseDate = baseDate[operation](amount, unit);
  }

  if (timeZone === 'Z') {
    return baseDate.utc().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
  }

  const offset = moment.duration(timeZone).asMinutes();
  return baseDate.utcOffset(offset).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
}

/**
 * Formats a date string with the specified time zone.
 * Validates the date string and time zone format.
 *
 * @param {string} dateStr - The date string in 'YYYY-MM-DD HH:mm:ss.SSS' format.
 * @param {string} timeZone - The time zone offset (e.g., "+05:30").
 * @returns {string|object} - The formatted date string or an error object if validation fails.
 */
function formatDateString(dateStr, timeZone) {
  // Handle "now" and "today" keywords with offsets
  const relativeDate = parseRelativeDate(dateStr, timeZone);
  if (relativeDate) {
    return relativeDate;
  }

  // Validate date string (without time zone)
  if (!moment(dateStr, 'YYYY-MM-DD HH:mm:ss.SSS', true).isValid()) {
    return { errorCode: 'INVALID_DATE_FORMAT', message: 'Date format should be YYYY-MM-DD HH:mm:ss.SSS' };
  }

  // Validate time zone
  const timeZoneRegex = /^([+-](?:2[0-3]|[01][0-9]):[0-5][0-9])$/;
  if (timeZone !== 'Z' && !timeZoneRegex.test(timeZone)) {
    return { errorCode: 'INVALID_TIMEZONE_FORMAT', message: 'Time zone format should be Z or ±HH:MM' };
  }

  // Format date string with time zone
  const date = moment(dateStr, 'YYYY-MM-DD HH:mm:ss.SSS');
  if (timeZone === 'Z') {
    return date.utc().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
  }

  const offset = moment.duration(timeZone).asMinutes();
  return date.utcOffset(offset).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
}

module.exports = {
  parseRelativeDate,
  formatDateString
};
