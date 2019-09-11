import test from 'ava'

import {parse} from '../lib/cmd/translate'

// eslint-disable-next-line max-params
const m = (t, input, text, from, to) => {
	t.deepEqual(parse(input), {text, from, to})
}

const u = undefined

test('empty', m, '', '', u, u)
test('word', m, 'fun', 'fun', u, u)

test('trim pre', m, ' fun', 'fun', u, u)
test('trim post', m, 'fun ', 'fun', u, u)
test('trim both', m, '  fun ', 'fun', u, u)

test('multiple words', m, ' fun yea yes  ', 'fun yea yes', u, u)

test('from pre', m, 'from en fun times', 'fun times', 'en', u)
test('from mid', m, 'fun from en times', 'fun times', 'en', u)
test('from post', m, 'fun times from en', 'fun times', 'en', u)

test('to pre', m, 'to en fun times', 'fun times', u, 'en')
test('to mid', m, 'fun to en times', 'fun times', u, 'en')
test('to post', m, 'fun times to en', 'fun times', u, 'en')

test('from & to pre', m, 'from en to pl fun times', 'fun times', 'en', 'pl')
test('from & to mid', m, 'from en fun times to pl', 'fun times', 'en', 'pl')
test('from & to post', m, 'fun times from en to pl', 'fun times', 'en', 'pl')

test('to & from pre', m, 'to pl from en fun times', 'fun times', 'en', 'pl')
test('to & from mid', m, 'to pl fun times from en', 'fun times', 'en', 'pl')
test('to & from post', m, 'fun times to pl from en', 'fun times', 'en', 'pl')

test('multiple from', m, 'from en fun from de', 'fun from de', 'en', u)
test('multiple to', m, 'to en to de fun', 'to de fun', u, 'en')
