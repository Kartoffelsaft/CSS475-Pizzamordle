import postgres from 'postgres';

const sql = postgres('postgres://postgres:@127.0.0.1/popularpizza');

export default sql;
