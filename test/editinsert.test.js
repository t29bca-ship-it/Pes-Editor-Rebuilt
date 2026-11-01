// Jugadores de la base agregados al EDIT (insertEditPlayers en js/app.js): llevan sus posiciones, el pie hábil, las
// habilidades de arquero en su lugar y el físico de PlayerAppearance.bin; si no, el juego los muestra sin puestos y con
// todo el cuerpo en -7. Los que agregaron versiones anteriores se arreglan solos (repairEditPlayers).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const csv = require('./load').load('pes20csv.js', 'Pes20Csv');
const grab = re => { const m = src.match(re); assert.ok(m, 'falta en app.js: ' + re); return m[0]; };
const code = [
  grab(/const POS_TO_PP = [^\n]*\n/), grab(/const BODY = [^\n]*\n/), grab(/const DB_ABIL = [^\n]*\n/),
  grab(/const DB_POSFLAG = [^\n]*\n/), grab(/let DBRAW = null, DBSIG = .*;[\s\S]*?\nasync function namesFromBin/).replace(/\nasync function namesFromBin$/, '\n'),
].join('');
const csvInsertStart = src.indexOf('function p20InsertCsvPlayers('), csvImportStart = src.indexOf('async function p20ImportCsv(', csvInsertStart);
assert.ok(csvInsertStart >= 0 && csvImportStart > csvInsertStart, 'falta p20InsertCsvPlayers en app.js');
const csvInsertCode = src.slice(csvInsertStart, csvImportStart);
const csvPlayerApplyStart = src.indexOf('function p20ApplyCsvPlayerFields(');
assert.ok(csvPlayerApplyStart >= 0 && csvImportStart > csvPlayerApplyStart, 'falta p20ApplyCsvPlayerFields en app.js');
const csvPlayerApplyCode = src.slice(csvPlayerApplyStart, csvImportStart);
const teamCode = [
  grab(/const ORD = [^\n]*\n/), grab(/const getOrder = [^\n]*\n/), grab(/const setOrder = [^\n]*\n/),
  grab(/function vacate\(t, slot\) \{[\s\S]*?\n\}/), grab(/function rosterRemove\(t, slot, auto = false\) \{[\s\S]*?\n\}/),
].join('');
const transferStart = src.indexOf('function p20RemoveRosterMembership(');
assert.ok(transferStart >= 0 && csvImportStart > transferStart, 'falta p20RemoveRosterMembership en app.js');
const transferCode = src.slice(transferStart, csvImportStart);
const csvFlowStart = src.indexOf('function p20CsvRecords('), csvFlowEnd = src.indexOf('\nfunction fillLazySelect(', csvImportStart);
assert.ok(csvFlowStart >= 0 && csvFlowEnd > csvImportStart, 'falta el flujo completo de importación CSV en app.js');
const csvFlowCode = src.slice(csvFlowStart, csvFlowEnd);
const PD = vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'pesdata.js'), 'utf8') + '\n;PesData', vm.createContext({ TextDecoder, TextEncoder }));
const toasts = [], hist = [];
const ctx = vm.createContext({
  TextDecoder, TextEncoder, Blob, Response, DecompressionStream, PD, toasts, hist, RATE_GEN: 0,
  S: null, toast: m => toasts.push(m), undo: () => { }, playerName: () => 'ALMADA',
  pget: null, rebuildTeamOf: () => { }, localStorage: (() => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; })(), edit: (label, key, regions, fn) => { hist.push(label); return fn(); },
});
vm.runInContext(code + `
pget = (p, k) => PD.player.get(S.d, p.base, k);
const setBits = (b, o, pos, n, v) => { for (let i = 0; i < n; i++) { const q = pos + i, m = 1 << (q & 7); if ((v >> i) & 1) b[o + (q >> 3)] |= m; else b[o + (q >> 3)] &= ~m; } };
;`, ctx);
vm.runInContext(csvInsertCode, ctx);
vm.runInContext(teamCode + csvPlayerApplyCode + transferCode, ctx);
const run = s => vm.runInContext(s, ctx);

// base con un jugador (id 7001): mediocampista con A en MC y MCD, B en MO; zurdo; arquero con valores distintos en cada habilidad
const ID = 7001, db = new Uint8Array(0x138);
db.set([ID & 255, ID >> 8, 0, 0], 8);
const put = (pos, n, v) => run('setBits')(db, 0, pos, n, v);
put(434, 4, 5); put(256, 7, 62 - 30); put(408, 6, 25 - 15); put(514, 1, 1);
put(456, 2, 2); put(414, 2, 2); put(464, 2, 1);
const gkDb = { gk: 70, catching: 61, clearing: 52, reflex: 83, cover: 44 };
for (const [k, v] of Object.entries(gkDb)) put(run('DB_ABIL')[k], 6, v - 40);
for (const k of ['atk', 'drib', 'lowpass']) put(run('DB_ABIL')[k], 6, 74 - 40);
db[0x1B] = 71; db.set(new TextEncoder().encode('ALMADA'), 0x81); db.set(new TextEncoder().encode('Thiago Almada'), 0xFB);
// PlayerAppearance.bin: id + 56 bytes que van tal cual al EDIT desde +0xFC
const app = new Uint8Array(60); app.set([ID & 255, ID >> 8, 0, 0], 0); for (let i = 4; i < 60; i++) app[i] = (i * 37) & 255;

function freshEdit() {
  const d = new Uint8Array(0x7C + 4 * 0x138);
  ctx.S = { d, f: { game: '2021' }, ix: null, hist: [], hp: 0 };
  run(`S.ix = PD.index(S.d, S.f.game); DBRAW = { b: DBX, off: new Map([[${ID}, 0]]) };`);
}
ctx.DBX = db;

test('al agregar un jugador de la base al EDIT van sus posiciones, el pie y el peso', () => {
  freshEdit(); run('DBAPP = null');
  assert.deepEqual([...run(`insertEditPlayers([${ID}])`)], [ID]);
  const p = run(`S.ix.byId.get(${ID})`), g = k => PD.player.get(ctx.S.d, p.base, k), pp = r => g('pos' + run('POS_TO_PP')[r]);
  assert.equal(g('reg_pos'), 5); assert.equal(pp(5), 2); assert.equal(pp(4), 2); assert.equal(pp(8), 1);
  assert.equal([0, 1, 2, 3, 6, 7, 9, 10, 11, 12].map(pp).join(''), '0000000000');
  assert.equal(g('weight'), 62); assert.equal(g('height'), 171); assert.equal(g('age'), 25); assert.equal(g('strong_foot'), 1);
  for (const [k, v] of Object.entries(gkDb)) assert.equal(g(k), v, k);
  // sin PlayerAppearance.bin: cuerpo normal (7 = 0 en el juego), nunca 0 (= -7)
  for (const [k] of run('BODY')) assert.equal(g(k), 7, k);
});

test('importar jugadores CSV agrega IDs ausentes manteniendo los registros ordenados', () => {
  const R = 0x138, d = new Uint8Array(0x7C + 3 * R);
  d[96] = 2;
  for (const [i, id] of [100, 300].entries()) d.set([id & 255, id >> 8, 0, 0], 0x7C + i * R);
  ctx.S = { d, f: { game: '2021' }, ix: null };
  run('S.ix = PD.index(S.d, S.f.game)');
  assert.equal(run('p20InsertCsvPlayers([{id: 200}])'), 1);
  assert.deepEqual([...run('S.ix.players.map(p => p.id)')], [100, 200, 300]);
  const base = run('S.ix.byId.get(200).base');
  assert.equal((d[base + 0xF0] | d[base + 0xF1] << 8 | d[base + 0xF2] << 16 | d[base + 0xF3] << 24) >>> 0, 200);
  assert.equal(PD.player.get(d, base, 'head_len'), 7);
});

test('importar una plantilla mueve jugadores y quita las convocatorias que el CSV no especifica', () => {
  const d = new Uint8Array(0x2000), oldTeam = {
    id: 300, name: 'Al Kuwait SC', national: false, rosterBase: 0x100, tacticsBase: 0x600,
  }, secondOldTeam = {
    id: 301, name: 'Another Club', national: false, rosterBase: 0x220, tacticsBase: 0x900,
  }, destination = {
    id: 500, name: 'Cong An Ha Noi', national: false, rosterBase: 0x340, tacticsBase: 0xC00,
  }, national = {
    id: 17, name: 'Kuwait', country: 17, national: true, rosterBase: 0x460, tacticsBase: 0xF00,
  };
  ctx.S = { d, f: { game: '2021' }, ix: { teams: [oldTeam, secondOldTeam, destination, national] } };
  run('tget = (t, k) => t[k]; isNat = t => t.national');
  for (let slot = 0; slot < 13; slot++) {
    PD.setRosterPlayer(d, oldTeam, slot, 1000 + slot);
    PD.setRosterPlayer(d, secondOldTeam, slot, 2000 + slot);
    PD.setNumber(d, oldTeam, slot, slot + 1);
    PD.setNumber(d, secondOldTeam, slot, slot + 1);
  }
  // The target has duplicate club memberships, like a player accidentally left in two clubs.
  PD.setRosterPlayer(d, oldTeam, 12, 1012);
  PD.setRosterPlayer(d, secondOldTeam, 12, 1012);
  PD.setRosterPlayer(d, national, 0, 1012);
  for (const t of [oldTeam, secondOldTeam, destination, national]) {
    d.set(Array.from({ length: 40 }, (_, i) => i), t.tacticsBase + 0x1E4);
    PD.setCaptainSlot(d, t, 0);
  }
  ctx.DEST = destination;
  const transfer = run("p20StagePlayerRosterChanges(DEST, [{id: 1012, fields: {nation: 17}}])");
  assert.equal(transfer.count, 3);
  assert.equal(PD.roster(transfer.data, oldTeam).some(x => x.pid === 1012), false);
  assert.equal(PD.roster(transfer.data, secondOldTeam).some(x => x.pid === 1012), false);
  assert.ok(PD.roster(d, oldTeam).some(x => x.pid === 1012), 'la etapa de confirmación no modifica el EDIT original');
  assert.ok(PD.roster(d, secondOldTeam).some(x => x.pid === 1012), 'la etapa de confirmación no modifica los otros clubes originales');
  ctx.TRANS = transfer;
  run('p20ApplyPlayerRosterChanges(TRANS)');
  PD.setRosterPlayer(d, destination, 0, 1012);
  assert.equal(PD.roster(d, oldTeam).filter(x => x.pid === 1012).length, 0);
  assert.equal(PD.roster(d, secondOldTeam).filter(x => x.pid === 1012).length, 0);
  assert.equal(PD.roster(d, destination).filter(x => x.pid === 1012).length, 1);
  assert.equal(PD.roster(d, national).some(x => x.pid === 1012), false, 'el CSV de jugadores no contiene una selección nacional');
  assert.equal(PD.roster(d, oldTeam).length, 12);
  assert.equal(PD.roster(d, oldTeam)[11].number, 12);
  assert.deepEqual([...PD.tacticalOrder(d, oldTeam)], Array.from({ length: 40 }, (_, i) => i));
});

test('p20ImportCsv applies Country, clears absent national-team assignments and remains undoable', async () => {
  const d = new Uint8Array(0x1200), oldTeam = {
    id: 300, name: 'Al Kuwait SC', country: 17, rosterBase: 0x100, tacticsBase: null,
  }, secondOldTeam = {
    id: 301, name: 'Another Club', country: 17, rosterBase: 0x300, tacticsBase: null,
  }, destination = {
    id: 500, name: 'Cong An TP. Ho Chi Minh', country: 38, rosterBase: 0x500, tacticsBase: null,
  }, national = {
    id: 17, name: 'Kuwait', country: 17, rosterBase: 0x700, tacticsBase: null,
  }, vietnam = {
    id: 18, name: 'Vietnam', country: 38, rosterBase: 0x900, tacticsBase: null,
  };
  d[96] = 1;
  PD.player.set(d, 0x7C, 'id', 1012);
  PD.player.set(d, 0x7C, 'comm_id', 1012);
  PD.player.set(d, 0x7C, 'nation', 17);
  PD.player.set(d, 0x7C, 'name', 'Alan Shearer');
  for (let slot = 0; slot < 13; slot++) {
    PD.setRosterPlayer(d, oldTeam, slot, 1000 + slot);
    PD.setRosterPlayer(d, secondOldTeam, slot, 2000 + slot);
    PD.setNumber(d, oldTeam, slot, slot + 1);
    PD.setNumber(d, secondOldTeam, slot, slot + 1);
  }
  PD.setRosterPlayer(d, oldTeam, 12, 1012);
  PD.setRosterPlayer(d, secondOldTeam, 12, 1012);
  PD.setRosterPlayer(d, secondOldTeam, 13, 3030);
  PD.setRosterPlayer(d, national, 0, 1012);
  PD.setRosterPlayer(d, vietnam, 0, 1012);
  const index = PD.index(d, '2021');
  index.teams = [oldTeam, secondOldTeam, destination, national, vietnam];
  index.teamById = new Map(index.teams.map(team => [team.id, team]));
  const row = new Array(csv.PLAYER_HEAD.length).fill('0');
  row[csv.PLAYER_HEAD.indexOf('Id')] = '1012';
  row[csv.PLAYER_HEAD.indexOf('Name')] = 'Alan Shearer';
  row[csv.PLAYER_HEAD.indexOf('Shirt')] = '20';
  row[csv.PLAYER_HEAD.indexOf('Country')] = '38';
  const file = {
    name: 'Jugadores - Cong An TP. Ho Chi Minh.csv',
    text: async () => csv.file(csv.PLAYER_HEAD, [row]),
  };
  ctx.FILE = file;
  const commits = [];
  ctx.S = { d, f: { game: '2021', desc: new Uint8Array(0), serial: new Uint8Array(0) }, ix: index,
    hist: [], hp: 0, savedHp: 0, fplan: 0, fvar: 0 };
  ctx.Pes20Csv = csv;
  ctx.edit = (label, key, regions, apply) => {
    const before = regions.map(([offset, length]) => [offset, d.slice(offset, offset + length)]);
    const result = apply();
    const after = regions.map(([offset, length]) => [offset, d.slice(offset, offset + length)]);
    commits.push({ label, regions, before, after });
    ctx.S.hist.push(commits.at(-1)); ctx.S.hp++;
    return result;
  };
  ctx.confirmBox = async () => true;
  ctx.tget = (team, key) => team[key];
  ctx.isNat = team => team.id < 100;
  ctx.sameTeamName = (a, b) => a.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === b.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  ctx.regT = team => [[team.rosterBase, 0x11C]];
  ctx.editPlayersRegion = extra => [[96, 2], [0x7C, (d[96] + (d[97] << 8) + extra) * 0x138]];
  ctx.rebuildTeamOf = () => {};
  ctx.render = () => {};
  ctx.toast = () => {};
  vm.runInContext(csvFlowCode, ctx);

  await run("p20ImportCsv(FILE, 'jugadores')");

  const clubRosters = [oldTeam, secondOldTeam, destination].map(team => PD.roster(d, team));
  assert.equal(clubRosters[0].filter(player => player.pid === 1012).length, 0);
  assert.equal(clubRosters[1].filter(player => player.pid === 1012).length, 0);
  assert.equal(clubRosters[2].filter(player => player.pid === 1012).length, 1);
  assert.equal(PD.roster(d, national).filter(player => player.pid === 1012).length, 0);
  assert.equal(PD.roster(d, vietnam).filter(player => player.pid === 1012).length, 0);
  assert.equal(PD.player.get(d, 0x7C, 'nation'), 38);
  assert.equal(PD.player.get(d, 0x7C, 'shirt'), '20');
  assert.equal(commits.length, 1);
  assert.ok(commits[0].regions.some(([offset]) => offset === oldTeam.rosterBase));
  assert.ok(commits[0].regions.some(([offset]) => offset === secondOldTeam.rosterBase));
  assert.ok(commits[0].regions.some(([offset]) => offset === destination.rosterBase));

  const beforeRejectedImport = d.slice();
  ctx.FILE = { name: 'Jugadores - Kuwait.csv', text: async () => csv.file(csv.PLAYER_HEAD, [row]) };
  await run("p20ImportCsv(FILE, 'jugadores')");
  assert.deepEqual([...d], [...beforeRejectedImport], 'la selección de destino incompatible se rechaza sin cambios');
  assert.equal(commits.length, 1);

  for (const [offset, bytes] of commits[0].before) d.set(bytes, offset);
  assert.equal(PD.roster(d, oldTeam).filter(player => player.pid === 1012).length, 1);
  assert.equal(PD.roster(d, secondOldTeam).filter(player => player.pid === 1012).length, 1);
  assert.equal(PD.roster(d, destination).filter(player => player.pid === 1012).length, 0);
  assert.equal(PD.roster(d, national).filter(player => player.pid === 1012).length, 1);
  assert.equal(PD.roster(d, vietnam).filter(player => player.pid === 1012).length, 1);
  assert.equal(PD.player.get(d, 0x7C, 'nation'), 17);

  const assignmentsRow = ['1012', 'Alan Shearer', '500', destination.name, '0', ''];
  ctx.FILE = { name: 'Equipos-Jugadores.csv', text: async () => csv.file(csv.TP_HEAD, [assignmentsRow]) };
  await run("p20ImportCsv(FILE, 'asignaciones')");
  assert.equal(PD.roster(d, oldTeam).filter(player => player.pid === 1012).length, 0);
  assert.equal(PD.roster(d, secondOldTeam).filter(player => player.pid === 1012).length, 0);
  assert.equal(PD.roster(d, destination).filter(player => player.pid === 1012).length, 1);
  assert.equal(PD.roster(d, national).filter(player => player.pid === 1012).length, 0);
  assert.equal(PD.roster(d, vietnam).filter(player => player.pid === 1012).length, 0);
  assert.ok(PD.roster(d, secondOldTeam).some(player => player.pid === 3030), 'un jugador ausente del CSV queda intacto');
  assert.equal(commits.length, 2);
  assert.ok(commits[1].regions.some(([offset]) => offset === oldTeam.rosterBase));
  assert.ok(commits[1].regions.some(([offset]) => offset === secondOldTeam.rosterBase));
  assert.ok(commits[1].regions.some(([offset]) => offset === destination.rosterBase));
  assert.ok(commits[1].regions.some(([offset]) => offset === national.rosterBase));

  for (const [offset, bytes] of commits[1].before) d.set(bytes, offset);
  assert.equal(PD.roster(d, oldTeam).filter(player => player.pid === 1012).length, 1);
  assert.equal(PD.roster(d, secondOldTeam).filter(player => player.pid === 1012).length, 1);
  assert.equal(PD.roster(d, destination).filter(player => player.pid === 1012).length, 0);
  assert.equal(PD.roster(d, national).filter(player => player.pid === 1012).length, 1);
  assert.equal(PD.roster(d, vietnam).filter(player => player.pid === 1012).length, 1);

  const beforeWrongCountry = d.slice();
  ctx.FILE = { name: 'Equipos-Jugadores.csv', text: async () => csv.file(csv.TP_HEAD, [
    ['1012', 'Alan Shearer', '0', '', '18', vietnam.name],
  ]) };
  await run("p20ImportCsv(FILE, 'asignaciones')");
  assert.deepEqual([...d], [...beforeWrongCountry], 'la selección de otro país se rechaza sin cambios');
  assert.equal(commits.length, 2);

  const beforeMissingColumn = d.slice();
  ctx.FILE = { name: 'Asignaciones-incompletas.csv', text: async () => csv.file(csv.TP_HEAD.slice(0, -1), [assignmentsRow.slice(0, -1)]) };
  await run("p20ImportCsv(FILE, 'asignaciones')");
  assert.deepEqual([...d], [...beforeMissingColumn], 'un CSV sin columna no toca el EDIT');
  assert.equal(commits.length, 2);

  const beforeBlankAssignment = d.slice();
  ctx.FILE = { name: 'Asignaciones-vacias.csv', text: async () => csv.file(csv.TP_HEAD, [
    ['1012', 'Alan Shearer', '0', '', '', ''],
  ]) };
  await run("p20ImportCsv(FILE, 'asignaciones')");
  assert.deepEqual([...d], [...beforeBlankAssignment], 'un valor vacío no se interpreta como 0 y no limpia la membresía');
  assert.equal(commits.length, 2);

  ctx.FILE = { name: 'Equipos-Jugadores.csv', text: async () => csv.file(csv.TP_HEAD, [
    ['1012', 'Alan Shearer', '0', '', '17', national.name],
  ]) };
  await run("p20ImportCsv(FILE, 'asignaciones')");
  assert.equal(PD.roster(d, oldTeam).filter(player => player.pid === 1012).length, 0);
  assert.equal(PD.roster(d, secondOldTeam).filter(player => player.pid === 1012).length, 0);
  assert.equal(PD.roster(d, national).filter(player => player.pid === 1012).length, 1);
  assert.equal(PD.roster(d, vietnam).filter(player => player.pid === 1012).length, 0);
  assert.ok(PD.roster(d, secondOldTeam).some(player => player.pid === 3030));
  assert.equal(commits.length, 3);
  for (const [offset, bytes] of commits[2].before) d.set(bytes, offset);
  assert.equal(PD.roster(d, oldTeam).filter(player => player.pid === 1012).length, 1);
  assert.equal(PD.roster(d, secondOldTeam).filter(player => player.pid === 1012).length, 1);
  assert.equal(PD.roster(d, national).filter(player => player.pid === 1012).length, 1);
  assert.equal(PD.roster(d, vietnam).filter(player => player.pid === 1012).length, 1);
});

test('importar campos CSV cambia la nacionalidad sin alterar los IDs del jugador', () => {
  const d = new Uint8Array(0x138);
  ctx.S = { d, f: { game: '2021' } };
  PD.player.set(d, 0, 'id', 1012);
  PD.player.set(d, 0, 'comm_id', 77);
  run('p20ApplyCsvPlayerFields({base: 0}, {id: 1012, comm_id: 999, nation: 38, e_basic: 1})');
  assert.equal(PD.player.get(d, 0, 'id'), 1012);
  assert.equal(PD.player.get(d, 0, 'comm_id'), 77);
  assert.equal(PD.player.get(d, 0, 'nation'), 38);
  assert.equal(PD.player.get(d, 0, 'e_basic'), 1);
});

test('con PlayerAppearance.bin, el físico y la apariencia se copian tal cual', async () => {
  freshEdit();
  assert.equal(await run('appearanceFromBin')(app), 1);
  run(`insertEditPlayers([${ID}])`);
  const p = run(`S.ix.byId.get(${ID})`), d = ctx.S.d;
  assert.deepEqual([...d.subarray(p.base + 0xFC, p.base + 0x134)], [...app.subarray(4)]);
  assert.equal(d[p.base + 0xF0] | d[p.base + 0xF1] << 8, ID);
});

test('los jugadores que se agregaron sin posiciones ni físico se arreglan al leer la base', () => {
  freshEdit(); run('DBAPP = null'); run(`insertEditPlayers([${ID}])`);
  const p = run(`S.ix.byId.get(${ID})`), base = p.base, set = (k, v) => PD.player.set(ctx.S.d, base, k, v);
  // como lo dejaba la versión anterior: sin puestos, peso 0, cuerpo en 0 y las de arquero cruzadas (+3 de la forma)
  for (let i = 0; i <= 12; i++) set('pos' + i, 0);
  set('weight', 0); set('strong_foot', 0); for (const [k] of run('BODY')) set(k, 0);
  const old = { gk: 52 + 3, catching: 44 + 3, clearing: 83 + 3, reflex: 70 + 3, cover: 61 + 3 };
  for (const [k, v] of Object.entries(old)) set(k, v);
  run('DBAPP = null'); toasts.length = 0;
  assert.equal(run('repairEditPlayers()'), 1);
  const g = k => PD.player.get(ctx.S.d, base, k);
  for (const [k, v] of Object.entries(gkDb)) assert.equal(g(k), v + 3, k);
  assert.equal(g('pos' + run('POS_TO_PP')[5]), 2); assert.equal(g('weight'), 62); assert.equal(g('strong_foot'), 1);
  assert.equal(g('neck_len'), 7);
  assert.match(toasts[0], /Arreglé a ALMADA/);
  // ya arreglado: no se vuelve a tocar
  assert.equal(run('repairEditPlayers()'), 0);
});

test('"Volver a la base del juego" saca al jugador del EDIT sin tocar a los demás', () => {
  freshEdit(); run('DBAPP = null');
  const d = ctx.S.d, other = 0x7C, R = 0x138;
  // un jugador propio del EDIT (id 5) antes del agregado
  d[96] = 1; d.set([5, 0, 0, 0], other); PD.player.set(d, other, 'name', 'PROPIO'); run('S.ix = PD.index(S.d, S.f.game)');
  run(`insertEditPlayers([${ID}])`);
  assert.equal(d[96], 2);
  assert.equal(run(`backToDb([${ID}, 5])`), 1); // el 5 no está en la base: no se toca
  assert.equal(d[96] | d[97] << 8, 1);
  assert.equal(PD.player.get(d, other, 'name'), 'PROPIO');
  assert.ok([...d.subarray(other + R, other + 2 * R)].every(v => v === 0));
  assert.match(toasts.at(-1), /volvió a la base del juego/);
});

test('las habilidades especiales, la IA, el estilo de juego y los movimientos se copian de la base (sin marcarlos)', () => {
  const keep = db.slice();
  put(485, 1, 1); put(447, 1, 1); put(155, 5, 13); put(441, 3, 2); put(123, 5, 15); put(422, 4, 5); // Elástica (sk1), Centro temprano (com5), estilo 13 de la base = Hombre objetivo
  freshEdit(); run('DBAPP = null'); run(`insertEditPlayers([${ID}])`);
  const p = run(`S.ix.byId.get(${ID})`), g = k => PD.player.get(ctx.S.d, p.base, k);
  assert.equal(g('sk1'), 1); assert.equal(g('com5'), 1); assert.equal(g('play_style'), 4);
  assert.equal(Object.keys(run('DB_SKILL')).filter(k => g('sk' + k)).length, 1);
  assert.equal([0, 1, 2, 3, 4, 5, 6].filter(i => g('com' + i)).join(), '5');
  assert.equal(g('e_skill') + g('e_style') + g('e_com'), 0);
  assert.equal(g('mo_hunchd'), 2); assert.equal(g('mo_fk'), 15); assert.equal(g('mo_ck'), 5);
  db.set(keep);
});

test('"Pasar toda la base": pasa a todos, avisa si la base cambió, la vuelve a pasar y los devuelve', () => {
  const R = 0x138, ids = [7001, 7002, 7003], b = new Uint8Array(R * 3);
  ids.forEach((id, i) => { b.set(db, i * R); b.set([id & 255, id >> 8, 0, 0], i * R + 8); b.set(new TextEncoder().encode('JUGADOR ' + i + '\0\0'), i * R + 0xFB); });
  const d = new Uint8Array(0x7C + 6 * R);
  ctx.S = { d, f: { game: '2021' }, ix: null, hist: [], hp: 0 };
  d[96] = 1; d.set([5, 0, 0, 0], 0x7C); PD.player.set(d, 0x7C, 'name', 'PROPIO');
  ctx.DB3 = b;
  run(`S.ix = PD.index(S.d, S.f.game); DBAPP = null; DBRAW = { b: DB3, off: new Map(${JSON.stringify(ids.map((id, i) => [id, i * R]))}) }; DBSIG = 'base-1'; allDbForget();`);
  assert.equal(run('dbToEditAll()'), 3);
  assert.equal(d[96], 4);
  assert.deepEqual([...run('S.ix.players.map(p => p.id)')], [5, ...ids]);
  assert.equal(run('allDbIds().length'), 3);
  assert.equal(run('checkDbChanged(true)'), false);
  // cambiás a uno y la base del juego se actualiza
  run(`PD.player.set(S.d, S.ix.byId.get(7002).base, 'name', 'MIO')`);
  run(`DBSIG = 'base-2'`);
  assert.equal(run('checkDbChanged(true)'), true);
  assert.equal(run('dbResync()'), 2);
  assert.equal(run(`PD.player.get(S.d, S.ix.byId.get(7002).base, 'name')`), 'MIO');
  assert.equal(run('S.ix.players.length'), 4);
  assert.equal(run('checkDbChanged(true)'), false);
  assert.match(toasts.at(-1), /1 que cambiaste vos|Los 1 que cambiaste/);
  // volver todos a la base: queda solo el propio
  assert.equal(run('allBackToDb()'), 3);
  assert.deepEqual([...run('S.ix.players.map(p => p.id)')], [5]);
  assert.equal(PD.player.get(d, 0x7C, 'name'), 'PROPIO');
  assert.equal(run('allDbIds().length'), 0);
});
