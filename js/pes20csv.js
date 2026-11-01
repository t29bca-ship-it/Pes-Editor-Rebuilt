// CSV con el formato de PES2020Editor (el editor de bases de PES 2020/2021 que usa la comunidad, por ejemplo en Evoweb):
// separador ";", UTF-8 con BOM, líneas CRLF, True/False y las mismas columnas en el mismo orden.
// Se comprobó campo por campo con los jugadores y equipos de un EDIT que PES2020Editor exportó (Maradona, Burak
// Yilmaz, un arquero y el Real Madrid): habilidades, posiciones, estilos, especiales, movimientos y marcas de edición.
const Pes20Csv = (() => {
  const PLAYER_HEAD = 'Id;Name;JapName;Shirt;ShirtNational;Commentary;Country;Country2;Height;Weight;Age;Foot;PlayingStyle;POS;GK;CB;LB;RB;DMF;CMF;LMF;RMF;AMF;LWF;RWF;SS;CF;OffensiveAwareness;BallControl;Dribbling;TightPossession;LowPass;LoftedPass;Finishing;Heading;PlaceKicking;Curl;Speed;Acceleration;KickingPower;Jump;PhysicalContact;Balance;Stamina;DefensiveAwareness;BallWinning;Aggression;GKAwareness;GKCatching;GKClearing;GKReflexes;GKReach;WeakFootUsage;WeakFootAcc;Form;InjuryResistance;Reputation;PlayingAttitude;Trickster;MazingRun;SpeedingBullet;IncisiveRun;LongBallExpert;EarlyCross;LongRanger;ScissorsFeint;DoubleTouch;FlipFlap;MarseilleTurn;Sombrero;CrossOverTurn;CutBehindAndTurn;ScotchMove;StepOnSkillcontrol;HeadingSpecial;LongRangeDrive;Chipshotcontrol;LongRangeShot;KnuckleShot;DippingShots;RisingShots;AcrobaticFinishing;HeelTrick;FirstTimeShot;OneTouchPass;ThroughPassing;WeightedPass;PinpointCrossing;OutsideCurler;Rabona;NoLookPass;LowLoftedPass;GKLowPunt;GKHighPunt;LongThrow;GKLongThrow;PenaltySpecialist;GKPenaltySaver;Gamesmanship;ManMarking;TrackBack;Interception;AcrobaticClear;Captaincy;SuperSub;FightingSpirit;Celebration1;Celebration2;DribblingHunching;DribblingArmMove.;RunningHunching;RunningArmMovement;CornerKicks;FreeKicks;PenaltyKick;DribbleMotion;YouthClub;OwnerClub;ContractUntil;LoanUntil;MarketValue;NationalCaps;Legend;Hand;WinnerGoldenBall;EditName;EditBasics;EditPosition;EditPositions;EditAbilities;EditPlayerSkills;EditPlayingStyle;EditCOMPlayingStyles;EditMovements;Edit1;Edit2;Edit3;Edit4;Edit5;Edit6;Edit7;Value1;Value2;Value3;Value2020_1;Value2020_2;Appearance;ListBoots;ListGloves;InEditFile;OverallStats'.split(';');
  const TEAM_HEAD = 'Id;Name;Country;Stadium;Coach;National;NameJapanese;NameSpanish;NameLatamSpanish;NameEnglish;NameUSEnglish;NameItalian;NamePortuguese;NameBrazilian;NameFrench;NameGerman;NameDutch;NameSwedish;NameRussian;NameGreek;NameTurkish;NameSimplifiedChinese;NameDatabase;NameEmpty1;NameEmpty2;NameEmpty3;NameEmpty4;ShortNameLicensed;ShortNameFake;Abbreviation;Commentary;StadiumFile;StadiumName;StadiumFileName;EmblemFile;EmblemFileName;Rival1;Rival2;Rival3;Banner1;Banner2;Banner3;Banner4;Kit1;Kit2;Kit3;Kit4;Kit5;Kit6;Kit7;Kit8;Kit9;Kit10;TeamColor1R;TeamColor1G;TeamColor1B;TeamColor2R;TeamColor2G;TeamColor2B;TurfPattern;SidelineColour;SeatColour;GoalStyle;NetPattern;GoalNettingDesign;GoalNettingColor1R;GoalNettingColor1G;GoalNettingColor1B;GoalNettingColor2R;GoalNettingColor2G;GoalNettingColor2B;Sponsor1;Sponsor2;Sponsor3;SponsorFile1;SponsorFile2;SponsorFile3;SponsorColorR;SponsorColorG;SponsorColorB;EditName;EditEmblem;EditStadium;EditStadiumName;EditStadiumFile;EditStadiumDetails;EditStadiumDetails2;EditRivals;EditBanners;EditTeamColors;EditCoach;EditSponsorFile;EditSponsorColors;EditSponsor;Edit1;Fake;LicencedPlayers;LicencedKits;LicencedCoach;LicencedCoach2;FeederTeam;ParentTeam;NonPlayableLeague;HasAnthem;AnthemStandingStyle;AnthemPlayersSinging;AnthemStandingAngle;Value1;Value2;Value3;Value4;Value5;Value6;Value7;ValueFF;Team2020_1;Team2020_2;Team2020_3;Team2020_4;Team2020_5;Team2020_6;Team2020_7;Team2020_8;Team2020_9;Team2020_10;Team2020_11;Country2020_1;Country2020_2;Country2020_3;Country2020_4;Country2020_5;Value2020_1;Value2020_2;Value2020_3;Value2020_4;Value2020_5;Value2020_6;Value2020_7;Value2020_8;Value2020_9;Value2020_10;Value2020_11;Value2020_12;Value2020_13;Value2020_14;Value2020_15;Value2020_16;Value2020_17'.split(';');
  const TP_HEAD = ['Id', 'Name', 'Id Club', 'Club', 'Id National', 'National'];

  // campo del EDIT de cada columna (mismo nombre que en pesdata.js)
  const ABIL = ['atk', 'ball_ctrl', 'drib', 'tight_pos', 'lowpass', 'loftpass', 'finish', 'header', 'place_kick', 'swerve', 'speed', 'exp_pwr', 'kick_pwr', 'jump', 'phys_cont', 'body_ctrl', 'stamina', 'def', 'ball_win', 'aggres', 'gk', 'catching', 'clearing', 'reflex', 'cover'];
  // especiales en el orden de PES2020Editor (ScissorsFeint … FightingSpirit), por número de habilidad del EDIT
  const SKILL = [0, 28, 1, 2, 3, 29, 4, 5, 30, 6, 7, 31, 39, 8, 32, 33, 9, 10, 11, 12, 40, 13, 14, 15, 16, 34, 17, 18, 35, 19, 20, 36, 37, 21, 22, 23, 38, 24, 25, 26, 27];
  // puestos GK…CF (número de puesto 0…12) → campo posN del EDIT
  const POS_TO_PP = [12, 9, 10, 11, 5, 6, 7, 8, 4, 2, 3, 1, 0];
  // PES2020Editor numera el estilo de juego como Player.bin (la lista vieja de PES 2019); acá, índice viejo → estilo del EDIT
  const STYLE_OLD = [0, 1, 2, 3, 6, 9, 10, 11, 14, 12, 19, 15, 17, 4, 5, 18, 20, 21, 7, 8, 13, 16];
  // estos se guardan desde 0 en el EDIT y PES2020Editor los muestra desde 1
  const PLUS1 = [['WeakFootUsage', 'weak_use'], ['WeakFootAcc', 'weak_acc'], ['Form', 'form'], ['InjuryResistance', 'injury'], ['Reputation', 'star'],
    ['DribblingHunching', 'mo_hunchd'], ['DribblingArmMove.', 'mo_armd'], ['RunningHunching', 'mo_hunchr'], ['RunningArmMovement', 'mo_armr'], ['CornerKicks', 'mo_ck'], ['FreeKicks', 'mo_fk'], ['PenaltyKick', 'mo_pk']];
  const FLAGS = [['EditName', 'e_player'], ['EditBasics', 'e_basic'], ['EditPosition', 'e_regpos'], ['EditPositions', 'e_playpos'], ['EditAbilities', 'e_ability'], ['EditPlayerSkills', 'e_skill'], ['EditPlayingStyle', 'e_style'], ['EditCOMPlayingStyles', 'e_com'], ['EditMovements', 'e_motion']];
  const NODATE = '1/1/0001 00:00:00';
  const B = v => v ? 'True' : 'False';
  const PI = Object.fromEntries(PLAYER_HEAD.map((k, i) => [k, i])), TI = Object.fromEntries(TEAM_HEAD.map((k, i) => [k, i]));

  // g(campo) devuelve el valor del EDIT; x: { inEdit, look (tiene apariencia propia), rating }
  // PlayingAttitude, Hand y DribbleMotion PES2020Editor los deja en 0; acá salen con el valor real
  function playerRow(g, x = {}) {
    const r = new Array(PLAYER_HEAD.length).fill('0'), set = (k, v) => { r[PI[k]] = String(v); };
    set('Id', g('id')); set('Name', g('name')); set('JapName', ''); set('Shirt', g('shirt')); set('ShirtNational', g('shirt_nt'));
    set('Commentary', g('comm_id') || g('id')); set('Country', g('nation')); set('Height', g('height')); set('Weight', g('weight')); set('Age', g('age'));
    set('Foot', B(g('strong_foot'))); set('PlayingStyle', Math.max(0, STYLE_OLD.indexOf(g('play_style')))); set('POS', g('reg_pos'));
    for (let i = 0; i < 13; i++) r[PI.GK + i] = String(g('pos' + POS_TO_PP[i]));
    ABIL.forEach((k, i) => { r[PI.OffensiveAwareness + i] = String(g(k)); });
    for (const [c, k] of PLUS1) set(c, g(k) + 1);
    set('PlayingAttitude', g('play_attit'));
    for (let i = 0; i < 7; i++) r[PI.Trickster + i] = B(g('com' + i));
    SKILL.forEach((n, i) => { r[PI.ScissorsFeint + i] = B(g('sk' + n)); });
    set('Celebration1', g('gc1')); set('Celebration2', g('gc2')); set('DribbleMotion', g('mo_drib'));
    set('ContractUntil', NODATE); set('LoanUntil', NODATE);
    for (const k of ['Legend', 'WinnerGoldenBall', 'Edit1', 'Edit3', 'Edit4', 'Edit5', 'Edit6', 'Edit7', 'Value2']) set(k, 'False');
    set('Hand', B(g('strong_hand')));
    for (const [c, k] of FLAGS) set(c, B(g(k)));
    set('Edit2', B(x.look)); set('Value3', x.inEdit ? -1 : 0); set('InEditFile', B(x.inEdit)); set('OverallStats', x.rating || 0);
    return r;
  }
  // al revés: una fila del CSV → valores de los campos del EDIT (para importar)
  function playerFields(row) {
    const v = k => row[PI[k]], n = k => +v(k) || 0, b = k => /^true$/i.test(v(k)), o = {};
    o.id = n('Id'); o.comm_id = n('Commentary') || o.id; o.name = v('Name') || ''; o.shirt = v('Shirt') || ''; o.shirt_nt = v('ShirtNational') || '';
    o.nation = n('Country'); o.height = n('Height'); o.weight = n('Weight'); o.age = n('Age'); o.strong_foot = +b('Foot'); o.strong_hand = +b('Hand');
    o.play_style = STYLE_OLD[n('PlayingStyle')] || 0; o.reg_pos = n('POS'); o.play_attit = n('PlayingAttitude');
    for (let i = 0; i < 13; i++) o['pos' + POS_TO_PP[i]] = +row[PI.GK + i] || 0;
    ABIL.forEach((k, i) => { o[k] = +row[PI.OffensiveAwareness + i] || 40; });
    for (const [c, k] of PLUS1) o[k] = Math.max(0, n(c) - 1);
    for (let i = 0; i < 7; i++) o['com' + i] = /^true$/i.test(row[PI.Trickster + i]) ? 1 : 0;
    SKILL.forEach((s, i) => { o['sk' + s] = /^true$/i.test(row[PI.ScissorsFeint + i]) ? 1 : 0; });
    o.gc1 = n('Celebration1'); o.gc2 = n('Celebration2'); o.mo_drib = n('DribbleMotion');
    for (const [c, k] of FLAGS) o[k] = +b(c);
    return o;
  }

  // g(campo) del equipo en el EDIT; x: { national, kits: [los 10 números de kit] }
  // césped, banda, asientos, arco y red salen del EDIT; de patrocinio y licencias todavía no se sabe dónde están:
  // salen como las deja PES2020Editor en un equipo sin tocar (−1, vacío, False o 0)
  function teamRow(g, x = {}) {
    const r = new Array(TEAM_HEAD.length).fill('0'), set = (k, v) => { r[TI[k]] = String(v); };
    for (let i = TI.NameJapanese; i <= TI.ShortNameFake; i++) r[i] = '';
    set('Id', g('id')); set('Name', g('name')); set('Country', g('country')); set('Stadium', g('stadium_id')); set('Coach', g('manager_id')); set('National', B(x.national));
    set('Abbreviation', g('short')); set('StadiumName', g('stadium_name'));
    for (const k of ['Commentary', 'StadiumFile', 'EmblemFile', 'Sponsor1', 'Sponsor2', 'Sponsor3', 'Value1', 'Value7', 'Value2020_1', 'Value2020_2', 'Value2020_3', 'Value2020_8']) set(k, -1);
    for (const k of ['StadiumFileName', 'EmblemFileName', 'SponsorFile1', 'SponsorFile2', 'SponsorFile3']) set(k, '');
    [1, 2, 3].forEach(i => set('Rival' + i, g('rival' + i))); [1, 2, 3, 4].forEach(i => set('Banner' + i, g('banner' + i)));
    for (let i = 0; i < 10; i++) set('Kit' + (i + 1), x.kits ? x.kits[i] >>> 0 : 4294950912);
    const col = ['c1r', 'c1g', 'c1b', 'c2r', 'c2g', 'c2b'].map(g);
    ['TeamColor1R', 'TeamColor1G', 'TeamColor1B', 'TeamColor2R', 'TeamColor2G', 'TeamColor2B'].forEach((k, i) => set(k, col[i]));
    ['GoalNettingColor1R', 'GoalNettingColor1G', 'GoalNettingColor1B', 'GoalNettingColor2R', 'GoalNettingColor2G', 'GoalNettingColor2B'].forEach((k, i) => set(k, g(['net1r', 'net1g', 'net1b', 'net2r', 'net2g', 'net2b'][i])));
    [['TurfPattern', 'turf'], ['SidelineColour', 'side_color'], ['SeatColour', 'seat_color'], ['GoalStyle', 'goal_style'], ['NetPattern', 'net_pattern']].forEach(([k, f]) => set(k, g(f)));
    set('GoalNettingDesign', g('net_b7') + 2 * (g('net_design') & 1)); // así lo lee PES2020Editor (2 bits desde 0x20.7)
    for (const k of ['SponsorColorR', 'SponsorColorG', 'SponsorColorB']) set(k, 63);
    for (let i = TI.EditName; i <= TI.LicencedCoach2; i++) r[i] = 'False';
    for (const k of ['HasAnthem', 'Value2']) set(k, 'False');
    set('EditName', B(g('e_name'))); set('EditEmblem', B(g('e_emblem'))); set('EditStadium', B(g('e_stadium'))); set('EditStadiumName', B(g('e_stadname'))); set('EditStadiumDetails', B(g('e_staddet')));
    set('EditRivals', B([1, 2, 3].some(i => g('rival' + i) !== 262143)));
    return r;
  }
  function teamFields(row) {
    const v = k => row[TI[k]], n = k => Number(v(k));
    const fields = [
      ['name', v('Name')], ['country', n('Country')], ['stadium_id', n('Stadium')], ['manager_id', n('Coach')],
      ['short', v('Abbreviation')], ['stadium_name', v('StadiumName')],
      ...[1, 2, 3].map(i => ['rival' + i, n('Rival' + i)]),
      ...[1, 2, 3, 4].map(i => ['banner' + i, v('Banner' + i)]),
      ...['c1r', 'c1g', 'c1b', 'c2r', 'c2g', 'c2b'].map((k, i) => [k, n(['TeamColor1R', 'TeamColor1G', 'TeamColor1B', 'TeamColor2R', 'TeamColor2G', 'TeamColor2B'][i])]),
      ...['net1r', 'net1g', 'net1b', 'net2r', 'net2g', 'net2b'].map((k, i) => [k, n(['GoalNettingColor1R', 'GoalNettingColor1G', 'GoalNettingColor1B', 'GoalNettingColor2R', 'GoalNettingColor2G', 'GoalNettingColor2B'][i])]),
      ['turf', n('TurfPattern')], ['side_color', n('SidelineColour')], ['seat_color', n('SeatColour')],
      ['goal_style', n('GoalStyle')], ['net_pattern', n('NetPattern')],
      ['net_b7', n('GoalNettingDesign') & 1], ['net_design_low', (n('GoalNettingDesign') >> 1) & 1],
      ['e_name', +/^true$/i.test(v('EditName'))], ['e_emblem', +/^true$/i.test(v('EditEmblem'))],
      ['e_stadium', +/^true$/i.test(v('EditStadium'))], ['e_stadname', +/^true$/i.test(v('EditStadiumName'))],
      ['e_staddet', +/^true$/i.test(v('EditStadiumDetails'))],
    ];
    for (let i = 0; i < 10; i++) fields.push(['kit' + i, n('Kit' + (i + 1))]);
    return fields;
  }
  const tpRow = (id, name, club, nat) => [id, name, club ? club.id : 0, club ? club.name : '', nat ? nat.id : 0, nat ? nat.name : ''].map(String);

  // archivo completo: BOM, encabezado y filas con CRLF (también al final, como PES2020Editor)
  const clean = v => String(v).replace(/[;\r\n]/g, ' ');
  const file = (head, rows) => '﻿' + [head, ...rows].map(r => r.map(clean).join(';')).join('\r\n') + '\r\n';
  function rosterTeamName(fileName) {
    const match = String(fileName).match(/^Jugadores\s+-\s+(.+)\.csv$/i);
    return match ? match[1].trim() : null;
  }
  function rosterSlots(items, oldRoster, order, rolesByPlan) {
    const slots = new Array(40).fill(null), retained = new Map();
    for (const player of oldRoster) {
      if (player.slot < 0 || player.slot >= slots.length) continue;
      const item = items.find(candidate => candidate.id === player.pid);
      if (item) retained.set(player.slot, item);
    }
    const validSlot = slot => Number.isInteger(slot) && slot >= 0 && slot < slots.length;
    const starters = order.slice(0, 11);
    const starterSlots = new Set(starters.filter(validSlot)), rolesAt = index =>
      [...new Set(rolesByPlan.map(plan => plan[index]).filter(role => Number.isInteger(role) && role >= 0 && role < 13))],
      compatible = (item, index) => {
      const fields = item.fields, natural = Number(fields.reg_pos);
      if (index === 0) return natural === 0 || (Number(fields.pos12) || 0) > 0;
      const roles = rolesAt(index);
      return roles.length > 0 && roles.every(role => (Number(fields['pos' + POS_TO_PP[role]]) || 0) > 0 || natural === role);
    };
    const positionScore = (item, index) => {
      if (!compatible(item, index)) return 0;
      const fields = item.fields, natural = Number(fields.reg_pos);
      if (index === 0) return 100 + (Number(fields.pos12) || 0) * 10 + (natural === 0 ? 1 : 0);
      const roles = rolesAt(index);
      return roles.reduce((score, role) => score + (Number(fields['pos' + POS_TO_PP[role]]) || 0) * 2 + (natural === role ? 1 : 0), 0);
    };
    const pinned = new Set();
    for (let i = 0; i < starters.length; i++) {
      const slot = starters[i];
      if (!validSlot(slot)) continue;
      const incumbent = retained.get(slot);
      if (incumbent && positionScore(incumbent, i) > 0) {
        slots[slot] = incumbent;
        pinned.add(incumbent.id);
      }
    }
    const pending = items.filter(item => !pinned.has(item.id));
    const vacancies = starters.map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => validSlot(slot) && slots[slot] === null);
    const candidates = vacancies.map(({ index }) => pending
      .map((item, playerIndex) => ({ playerIndex, score: positionScore(item, index) }))
      .filter(candidate => candidate.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(candidate => candidate.playerIndex));
    const playerToVacancy = new Map();
    const assign = (vacancyIndex, visited) => {
      for (const playerIndex of candidates[vacancyIndex]) {
        if (visited.has(playerIndex)) continue;
        visited.add(playerIndex);
        const previous = playerToVacancy.get(playerIndex);
        if (previous === undefined || assign(previous, visited)) {
          playerToVacancy.set(playerIndex, vacancyIndex);
          return true;
        }
      }
      return false;
    };
    const assignmentOrder = vacancies.map((_, i) => i)
      .sort((a, b) => candidates[a].length - candidates[b].length || a - b);
    for (const vacancyIndex of assignmentOrder) assign(vacancyIndex, new Set());
    const vacancyToPlayer = new Map([...playerToVacancy].map(([playerIndex, vacancyIndex]) => [vacancyIndex, playerIndex]));
    const assigned = new Set();
    for (const [vacancyIndex, playerIndex] of vacancyToPlayer) {
      slots[vacancies[vacancyIndex].slot] = pending[playerIndex];
      assigned.add(playerIndex);
    }
    const remaining = pending.filter((_, i) => !assigned.has(i));
    pending.splice(0, pending.length, ...remaining);
    for (const player of oldRoster) {
      if (starterSlots.has(player.slot) || slots[player.slot]) continue;
      const retainedPlayer = retained.get(player.slot), i = retainedPlayer && pending.findIndex(item => item.id === retainedPlayer.id);
      if (i >= 0) slots[player.slot] = pending.splice(i, 1)[0];
    }
    const benchSlots = [...order.slice(11), ...Array.from({ length: 40 }, (_, i) => i)]
      .filter((slot, i, all) => validSlot(slot) && !starterSlots.has(slot) && slots[slot] === null && all.indexOf(slot) === i);
    for (const slot of benchSlots) {
      if (!pending.length) break;
      slots[slot] = pending.shift();
    }
    const starterSlotsInOrder = starters.filter(validSlot);
    const duplicateStarters = starterSlotsInOrder.filter((slot, i) => starterSlotsInOrder.indexOf(slot) !== i);
    const missingStarters = starters.filter(slot => !validSlot(slot) || slots[slot] === null);
    const missingDetails = missingStarters.map(slot => {
      const index = starters.indexOf(slot);
      const candidates = items.filter(item => compatible(item, index));
      return { slot, index, roles: rolesAt(index), candidates: candidates.length };
    });
    return { slots, unplaced: pending, missingStarters, missingDetails, duplicateStarters };
  }
  function parse(text) {
    const rows = []; let row = [], cell = '', quoted = false;
    text = text.replace(/^﻿/, '');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') quoted = false;
        else cell += c;
      } else if (c === '"' && !cell) quoted = true;
      else if (c === ';') { row.push(cell); cell = ''; }
      else if (c === '\r' || c === '\n') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); cell = '';
        if (row.some(x => x !== '')) rows.push(row);
        row = [];
      } else cell += c;
    }
    if (quoted) throw new Error('El CSV tiene un campo entre comillas sin cerrar.');
    if (cell || row.length) { row.push(cell); if (row.some(x => x !== '')) rows.push(row); }
    const head = rows.shift() || [];
    if (rows.some(r => r.length !== head.length)) throw new Error('El CSV tiene filas con distinta cantidad de columnas.');
    return { head, rows };
  }
  return { PLAYER_HEAD, TEAM_HEAD, TP_HEAD, STYLE_OLD, playerRow, playerFields, teamRow, teamFields, tpRow, file, rosterTeamName, rosterSlots, parse };
})();
