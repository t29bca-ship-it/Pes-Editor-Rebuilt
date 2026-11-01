// Exportar a CSV de PES2020Editor (js/pes20csv.js): un jugador real del EDIT tiene que salir igual,
// columna por columna, a como lo exporta PES2020Editor, y el CSV leído de vuelta tiene que dar los mismos campos.
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load");

const C = load("pes20csv.js", "Pes20Csv");

// Campos leídos del EDIT (PesData.player.get) y la fila que exportó PES2020Editor para el mismo jugador.
const FIELDS = {"id":34862,"name":"Burak Yilmaz","shirt":"BURAK","shirt_nt":"","comm_id":34862,"nation":190,"height":188,"weight":0,"age":31,"strong_foot":0,"play_style":0,"reg_pos":12,"pos12":0,"pos9":0,"pos10":0,"pos11":0,"pos5":0,"pos6":0,"pos7":0,"pos8":0,"pos4":0,"pos2":0,"pos3":0,"pos1":0,"pos0":0,"atk":99,"ball_ctrl":99,"drib":96,"tight_pos":99,"lowpass":99,"loftpass":98,"finish":99,"header":95,"place_kick":99,"swerve":97,"speed":99,"exp_pwr":95,"kick_pwr":99,"jump":99,"phys_cont":99,"body_ctrl":92,"stamina":99,"def":91,"ball_win":94,"aggres":99,"gk":40,"catching":40,"clearing":40,"reflex":40,"cover":40,"weak_use":2,"weak_acc":2,"form":5,"injury":0,"star":4,"mo_hunchd":0,"mo_armd":0,"mo_hunchr":0,"mo_armr":0,"mo_ck":0,"mo_fk":0,"mo_pk":0,"play_attit":0,"com0":0,"com1":0,"com2":0,"com3":0,"com4":0,"com5":0,"com6":0,"sk0":0,"sk28":0,"sk1":0,"sk2":0,"sk3":0,"sk29":0,"sk4":0,"sk5":0,"sk30":0,"sk6":0,"sk7":0,"sk31":0,"sk39":0,"sk8":0,"sk32":0,"sk33":0,"sk9":0,"sk10":0,"sk11":0,"sk12":0,"sk40":0,"sk13":0,"sk14":0,"sk15":0,"sk16":0,"sk34":0,"sk17":0,"sk18":0,"sk35":0,"sk19":0,"sk20":0,"sk36":0,"sk37":0,"sk21":0,"sk22":0,"sk23":0,"sk38":0,"sk24":0,"sk25":0,"sk26":0,"sk27":0,"gc1":0,"gc2":0,"mo_drib":0,"strong_hand":0,"e_player":1,"e_basic":1,"e_regpos":1,"e_playpos":1,"e_ability":1,"e_skill":1,"e_style":1,"e_com":1,"e_motion":1};
const ROW = "34862;Burak Yilmaz;;BURAK;;34862;190;0;188;0;31;False;0;12;0;0;0;0;0;0;0;0;0;0;0;0;0;99;99;96;99;99;98;99;95;99;97;99;95;99;99;99;92;99;91;94;99;40;40;40;40;40;3;3;6;1;5;0;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;0;0;1;1;1;1;1;1;1;0;0;0;1/1/0001 00:00:00;1/1/0001 00:00:00;0;0;False;False;False;True;True;True;True;True;True;True;True;True;False;False;False;False;False;False;False;0;False;-1;0;0;0;0;0;True;106";
const g = k => FIELDS[k];

test("la fila del jugador es igual a la de PES2020Editor", () => {
  const row = C.playerRow(g, { inEdit: true, look: false, rating: 106 });
  assert.equal(row.length, C.PLAYER_HEAD.length);
  const want = ROW.split(";");
  row.forEach((v, i) => assert.equal(v, want[i], C.PLAYER_HEAD[i]));
});

test("el CSV se lee de vuelta con los mismos campos", () => {
  const back = C.playerFields(ROW.split(";"));
  for (const [k, v] of Object.entries(back)) assert.equal(v, FIELDS[k], k);
});

test("Country se importa como el ID de nacionalidad del jugador", () => {
  const row = ROW.split(";");
  row[C.PLAYER_HEAD.indexOf("Country")] = "38";
  assert.equal(C.playerFields(row).nation, 38);
});

test("el archivo lleva BOM, punto y coma y fin de línea de Windows", () => {
  const txt = C.file(C.PLAYER_HEAD, [C.playerRow(g, { inEdit: true, look: false, rating: 106 })]);
  assert.ok(txt.startsWith("\uFEFFId;Name;JapName;"));
  assert.ok(txt.endsWith("\r\n"));
  const p = C.parse(txt);
  assert.equal(p.head.join(";"), C.PLAYER_HEAD.join(";"));
  assert.equal(p.rows[0].join(";"), ROW);
});

test("el equipo tiene las columnas de PES2020Editor y los kits en orden", () => {
  const t = { id: 109, name: "Real Madrid CF", nation: 0, stadium: 0, coach: 0, rival1: 262143, rival2: 262143, rival3: 262143 };
  const row = C.teamRow(k => t[k] ?? 0, { national: false, kits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
  assert.equal(row.length, C.TEAM_HEAD.length);
  const at = k => row[C.TEAM_HEAD.indexOf(k)];
  assert.equal(at("Id"), "109");
  assert.equal(at("Kit1"), "1");
  assert.equal(at("Kit10"), "10");
  assert.equal(at("EditRivals"), "False");
  assert.equal(at("National"), "False");
});

test("el estadio del equipo sale con los mismos valores que PES2020Editor (C.A La Mafia Animal)", () => {
  // valores leídos del EDIT y columnas que exportó PES2020Editor para el mismo equipo
  const t = { turf: 2, side_color: 5, seat_color: 5, goal_style: 2, net_pattern: 1, net_b7: 1, net_design: 5, net1r: 5, net1g: 38, net1b: 5, net2r: 48, net2g: 38, net2b: 5, e_staddet: 1 };
  const row = C.teamRow(k => t[k] ?? 0, { national: false });
  const at = k => row[C.TEAM_HEAD.indexOf(k)];
  assert.deepEqual(["TurfPattern", "SidelineColour", "SeatColour", "GoalStyle", "NetPattern", "GoalNettingDesign"].map(at), ["2", "5", "5", "2", "1", "3"]);
  assert.deepEqual(["R", "G", "B"].flatMap(c => [at("GoalNettingColor1" + c), at("GoalNettingColor2" + c)]), ["5", "48", "38", "38", "5", "5"]);
  assert.equal(at("EditStadiumDetails"), "True");
});

test("los campos editables del equipo se pueden recuperar del CSV por sus columnas", () => {
  const t = { id: 900, name: "Rainmakers", country: 204, stadium_id: 29, manager_id: 100967, short: "RMC", stadium_name: "Rainmakers Park",
    rival1: 262143, rival2: 12, rival3: 13, banner1: "A", banner2: "B", banner3: "C", banner4: "D",
    c1r: 15, c1g: 28, c1b: 48, c2r: 55, c2g: 55, c2b: 55,
    net1r: 1, net1g: 2, net1b: 3, net2r: 4, net2g: 5, net2b: 6,
    turf: 2, side_color: 1, seat_color: 3, goal_style: 2, net_pattern: 1, net_b7: 1, net_design: 5,
    e_name: 1, e_emblem: 1, e_stadium: 0, e_stadname: 1, e_staddet: 1 };
  const row = C.teamRow(k => t[k] ?? 0, { national: false, kits: [101, 102, 103, 104, 105, 106, 107, 108, 109, 110] });
  const fields = Object.fromEntries(C.teamFields(row));
  for (const k of Object.keys(t).filter(k => k !== "id" && k !== "net_design")) assert.equal(fields[k], t[k], k);
  assert.equal(fields.net_design_low, t.net_design & 1);
  assert.equal(fields.net_b7, t.net_b7);
  assert.deepEqual(Array.from({ length: 10 }, (_, i) => fields["kit" + i]), [101, 102, 103, 104, 105, 106, 107, 108, 109, 110]);
});

test("el nombre del archivo de jugadores identifica el equipo de destino", () => {
  assert.equal(C.rosterTeamName("Jugadores - Cong An Ha Noi.csv"), "Cong An Ha Noi");
  assert.equal(C.rosterTeamName("jugadores - Real Madrid.CSV"), "Real Madrid");
  assert.equal(C.rosterTeamName("Jugadores.csv"), null);
});

test("los jugadores nuevos ocupan los titulares según sus posiciones y los demás van al banco", () => {
  const pp = [12, 9, 10, 11, 5, 6, 7, 8, 4, 2, 3, 1, 0];
  const make = (id, pos, secondary = []) => {
    const fields = { reg_pos: pos };
    for (let role = 0; role < pp.length; role++) fields["pos" + pp[role]] = role === pos ? 2 : secondary.includes(role) ? 1 : 0;
    return { id, fields };
  };
  const items = [0, 1, 1, 3, 2, 4, 5, 5, 8, 12, 12, 8, 4]
    .map((pos, i) => make(100 + i, pos, [6, 7].includes(i) ? [4] : i === 9 ? [8] : []));
  const order = [0, 11, 3, 9, 8, 15, 18, 13, 17, 24, 23, ...Array.from({ length: 29 }, (_, i) => i + 1).filter(slot => ![3, 8, 9, 11, 13, 15, 17, 18, 23, 24].includes(slot))];
  const roles = [[0, 1, 1, 3, 2, 4, 5, 5, 8, 12, 12], [0, 1, 1, 3, 2, 4, 4, 4, 8, 8, 12], [0, 1, 1, 3, 2, 4, 5, 5, 8, 12, 12]];
  const result = C.rosterSlots(items, [{ slot: 0, pid: 900 }, { slot: 11, pid: 901 }], order, roles);

  assert.deepEqual([...result.unplaced], []);
  const xi = order.slice(0, 11).map(slot => result.slots[slot]);
  assert.deepEqual(xi.map(player => player.fields.reg_pos), [0, 1, 1, 3, 2, 4, 5, 5, 8, 12, 12]);
  assert.equal(result.slots[0].fields.reg_pos, 0, "el portero nunca hereda el puesto de un jugador de campo");
  assert.deepEqual(Array.from(result.slots).filter(Boolean).map(player => player.id).sort((a, b) => a - b),
    items.map(player => player.id).sort((a, b) => a - b));
});

test("preserva el slot táctico de jugadores que coinciden por ID", () => {
  const player = { id: 77, fields: { reg_pos: 1, pos9: 2 } };
  const result = C.rosterSlots([player], [{ slot: 11, pid: 77 }], [0, 11, ...Array.from({ length: 38 }, (_, i) => i + 1).filter(slot => slot !== 11)],
    [[0, 1], [0, 1], [0, 1]]);
  assert.equal(result.slots[11], player);
  assert.equal(result.slots[0], null, "no mueve a un jugador de campo a la portería");
  assert.deepEqual([...result.unplaced], []);
});

test("al volver a importar corrige titulares existentes incompatibles sin cambiar el orden táctico", () => {
  const goalkeeper = { id: 80, fields: { reg_pos: 0, pos12: 2 } };
  const defender = { id: 81, fields: { reg_pos: 1, pos9: 2 } };
  const striker = { id: 82, fields: { reg_pos: 12, pos0: 2 } };
  const items = [goalkeeper, defender, striker], order = Array.from({ length: 40 }, (_, i) => i);
  const roles = Array.from({ length: 3 }, () => [0, 1, 12, ...Array(8).fill(5)]);
  const result = C.rosterSlots(items,
    [{ slot: 0, pid: striker.id }, { slot: 1, pid: goalkeeper.id }, { slot: 2, pid: defender.id }],
    order, roles);
  assert.equal(result.slots[0], goalkeeper);
  assert.equal(result.slots[1], defender);
  assert.equal(result.slots[2], striker);
  assert.deepEqual([...result.unplaced], []);
});

test("elige una combinación global antes de dejar un puesto titular vacío", () => {
  const versatile = { id: 83, fields: { reg_pos: 1, pos9: 2, pos6: 2 } };
  const defenderOnly = { id: 84, fields: { reg_pos: 1, pos9: 2 } };
  const items = [versatile, defenderOnly], order = Array.from({ length: 40 }, (_, i) => i);
  const roles = Array.from({ length: 3 }, () => [0, 1, 5, ...Array(8).fill(12)]);
  const result = C.rosterSlots(items, [], order, roles);

  assert.equal(result.slots[0], null, "el CSV no contiene portero, así que la portería permanece vacía");
  assert.equal(result.slots[1], defenderOnly, "el único central se conserva en su puesto");
  assert.equal(result.slots[2], versatile, "el jugador versátil cubre el puesto restante");
  assert.ok(result.missingStarters.includes(0));
  assert.ok(!result.missingStarters.includes(1) && !result.missingStarters.includes(2));
  assert.deepEqual([...result.unplaced], []);
});

test("un rol de otro plan no bloquea titulares compatibles con el plan seleccionado", () => {
  const items = [{ id: 1, fields: { reg_pos: 0, pos12: 2 } }];
  for (let id = 2; id <= 11; id++) items.push({ id, fields: { reg_pos: 1, pos9: 2 } });
  const order = Array.from({ length: 40 }, (_, i) => i);
  const activeRoles = [0, ...Array(10).fill(1)];
  const alternateRoles = [...activeRoles];
  alternateRoles[5] = 11;
  const rolesByPlan = [activeRoles, alternateRoles, activeRoles];
  const selectedPlanVariants = [activeRoles, activeRoles, activeRoles];
  const strict = C.rosterSlots(items, [], order, rolesByPlan);
  assert.equal(strict.missingStarters.length, 1, "el rol exclusivo del plan alternativo no está en el CSV");

  const result = C.rosterSlots(items, [], order, selectedPlanVariants);
  assert.deepEqual([...result.missingStarters], []);
  assert.deepEqual([...result.unplaced], []);
  assert.deepEqual(order.slice(0, 11).map(slot => result.slots[slot].id).sort((a, b) => a - b),
    items.map(player => player.id).sort((a, b) => a - b));
});

test("una variante alternativa del plan no bloquea la variante seleccionada y expone el rol faltante", () => {
  const items = [{ id: 1, fields: { reg_pos: 0, pos12: 2 } }];
  for (let id = 2; id <= 11; id++) items.push({ id, fields: { reg_pos: 1, pos9: 2 } });
  const order = Array.from({ length: 40 }, (_, i) => i);
  const baseRoles = [0, ...Array(10).fill(1)];
  const attackRoles = [...baseRoles];
  attackRoles[5] = 11;

  const blockedByInactiveVariant = C.rosterSlots(items, [], order, [baseRoles, attackRoles, baseRoles]);
  assert.deepEqual([...blockedByInactiveVariant.missingStarters], [5]);
  const missingDetail = blockedByInactiveVariant.missingDetails[0];
  assert.equal(missingDetail.slot, 5);
  assert.equal(missingDetail.index, 5);
  assert.deepEqual([...missingDetail.roles], [1, 11]);
  assert.equal(missingDetail.candidates, 0);

  const selectedBase = C.rosterSlots(items, [], order, [baseRoles]);
  assert.deepEqual([...selectedBase.missingStarters], []);
  assert.deepEqual([...selectedBase.unplaced], []);

  const selectedAttack = C.rosterSlots(items, [], order, [attackRoles]);
  assert.deepEqual([...selectedAttack.missingStarters], [5]);
  assert.equal(selectedAttack.missingDetails[0].roles[0], 11);
  assert.equal(selectedAttack.missingDetails[0].candidates, 0);
});

test("no ubica a un jugador de campo en la portería si el CSV no trae un portero", () => {
  const player = { id: 78, fields: { reg_pos: 12, pos0: 2 } };
  const order = [0, ...Array.from({ length: 39 }, (_, i) => i + 1)];
  const roles = [[0, ...Array(10).fill(12)], [0, ...Array(10).fill(12)], [0, ...Array(10).fill(12)]];
  const result = C.rosterSlots([player], [], order, roles);
  assert.equal(result.slots[0], null);
  assert.equal(result.slots[1], player);
  assert.ok(result.missingStarters.includes(0), "la importación detecta que el puesto de arquero quedó vacío");
  assert.ok(!result.missingStarters.includes(1), "el jugador de campo solo ocupa un puesto compatible");
  assert.equal(result.missingDetails[0].slot, 0);
  assert.equal(result.missingDetails[0].index, 0);
  assert.deepEqual([...result.missingDetails[0].roles], [0]);
  assert.equal(result.missingDetails[0].candidates, 0);
  assert.deepEqual([...result.unplaced], []);
});

test("informa los titulares duplicados para que la importación pueda cancelarse", () => {
  const items = [{ id: 79, fields: { reg_pos: 0, pos12: 2 } }];
  const order = [0, 0, ...Array.from({ length: 38 }, (_, i) => i + 1)];
  const roles = Array.from({ length: 3 }, () => [0, ...Array(10).fill(12)]);
  const result = C.rosterSlots(items, [], order, roles);
  assert.deepEqual([...result.duplicateStarters], [0]);
});

test("no fuerza jugadores incompatibles a titulares cuando ya no quedan slots de suplente", () => {
  const items = Array.from({ length: 40 }, (_, i) => ({ id: i + 1, fields: { reg_pos: 12, pos0: 2 } }));
  const order = Array.from({ length: 40 }, (_, i) => i);
  const roles = Array.from({ length: 3 }, () => [0, ...Array(8).fill(1), 12, 12]);
  const result = C.rosterSlots(items, [], order, roles);
  assert.equal(result.slots[0], null);
  assert.equal(result.slots[1], null);
  assert.ok(result.missingStarters.length > 0);
  assert.equal(result.unplaced.length, 9);
});

test("los ; y saltos de línea de un nombre no rompen el CSV", () => {
  const p = C.parse(C.file(["Id", "Name"], [["1", "A;B\r\nC"]]));
  assert.deepEqual([...p.rows[0]], ["1", "A B  C"]);
});

test("el lector CSV maneja campos entre comillas, separadores y saltos de línea", () => {
  const p = C.parse('\uFEFFId;Name\r\n1;"A; ""Club""\r\nFC"\r\n');
  assert.deepEqual([...p.head], ["Id", "Name"]);
  assert.deepEqual([...p.rows[0]], ["1", 'A; "Club"\r\nFC']);
});

test("el lector CSV rechaza filas incompletas y comillas sin cerrar", () => {
  assert.throws(() => C.parse("Id;Name\r\n1"), /distinta cantidad de columnas/);
  assert.throws(() => C.parse('Id;Name\r\n1;"Club'), /comillas sin cerrar/);
});
