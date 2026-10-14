
const sb = supabase.createClient(
    "https://dhqsjwanjrcblrhevfcq.supabase.co",
    "sb_publishable_55XUZSnWLqML_VKscgI1Ow_AAWJiCTa",
    { auth: { persistSession: true } },
  ),
  $ = (s) => document.querySelector(s),
  S = {
    u: null,
    p: null,
    profiles: [],
    employees: [],
    shifts: [],
    bookings: [],
    products: [],
    leave: [],
    bugs: [],
    logs: [],
    week: weekStart(new Date()),
    month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    bm: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    mode: "week",
    proposal: [],
    availability: [],
    announcements: [],
    swaps: [],
    reservationPlaces: [],
    bookingMode:
      localStorage.getItem("cafeBookingMode") ||
      (matchMedia("(max-width:700px)").matches ? "week" : "month"),
    bookingWeek: weekStart(new Date()),
  };
function weekStart(d) {
  d = new Date(d);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}
const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    ),
  ISO = (d) => {
    d = new Date(d);
    let z = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  },
  mins = (t) => +t.slice(0, 2) * 60 + +t.slice(3, 5),
  hours = (x) => (mins(x.end_time) - mins(x.start_time)) / 60;
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 2200);
}
function F(id, l, t = "text", x = "") {
  return `<label>${l}</label><input id="${id}" type="${t}" ${x}>`;
}
function M(t, h, fn, show = true) {
  $("#dt").textContent = t;
  $("#fields").innerHTML = h;
  $("#save").classList.toggle("hide", !show);
  $("#form").onsubmit = async (e) => {
    e.preventDefault();
    await fn();
  };
  $("#dlg").showModal();
}
function manage() {
  return ["admin", "manager"].includes(S.p?.role);
}
async function load() {
  const core = await Promise.all([
    sb.from("profiles").select("*").order("full_name"),
    sb.from("employees").select("*").eq("active", true),
    sb.from("work_shifts").select("*,employees(full_name)"),
    sb.from("bookings").select("*"),
    sb.from("shopping").select("*"),
    sb.from("time_off_requests").select("*"),
    sb
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);
  core.forEach((x) => x.error && console.warn(x.error.message));
  [S.profiles, S.employees, S.shifts, S.bookings, S.products, S.leave, S.bugs] =
    core.map((x) => x.data || []);
  const lr = await sb
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  S.logs = lr.error ? [] : lr.data || [];
  const optional = await Promise.all([
    sb.from("availability").select("*").order("work_date"),
    sb
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    sb
      .from("shift_swaps")
      .select("*")
      .order("created_at", { ascending: false }),
    sb.from("reservation_places").select("*").order("sort_order").order("name"),
    sb.from("cafe_rooms").select("*").order("sort_order"),
    sb.from("cafe_tables").select("*").order("label"),
    sb.from("menu_items").select("*").order("category").order("name"),
    sb.from("pos_orders").select("*").order("created_at", { ascending: false }).limit(300),
    sb.from("pos_order_items").select("*").limit(1000),
    sb.from("pos_payments").select("*").order("created_at", { ascending: false }).limit(500),
    sb.from("business_expenses").select("*").order("expense_date", { ascending: false }).limit(300),
    sb.from("cash_sessions").select("*").order("opened_at", { ascending: false }).limit(50),
  ]);
  const optionalData = optional.map((x) => x.error ? [] : (x.data || []));
  [S.availability, S.announcements, S.swaps, S.reservationPlaces, S.rooms, S.tables, S.menuItems, S.orders, S.orderItems, S.payments, S.expenses, S.cashSessions] = optionalData;
  S.rooms ||= []; S.tables ||= []; S.menuItems ||= []; S.orders ||= []; S.orderItems ||= []; S.payments ||= []; S.expenses ||= []; S.cashSessions ||= [];
}
async function boot(s) {
  S.u = s?.user || null;
  $("#auth").classList.toggle("hide", !!S.u);
  $("#app").classList.toggle("hide", !S.u);
  if (!S.u) return;
  let { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", S.u.id)
    .single();
  if (error) return alert(error.message);
  S.p = data;
  $("#ini").textContent = (data.full_name || "U")[0];
  $("#settings").classList.toggle("hide", data.role !== "admin");
  $("#employees").classList.toggle("hide", !manage());
  await load();
  view(manage() ? "dashboard" : "schedule");
  showLatestAnnouncement();
}
document.querySelectorAll("[data-a]").forEach(
  (b) =>
    (b.onclick = () => {
      document
        .querySelectorAll("[data-a]")
        .forEach((x) => x.classList.toggle("on", x === b));
      $("#login").classList.toggle("hide", b.dataset.a !== "login");
      $("#signup").classList.toggle("hide", b.dataset.a !== "signup");
    }),
);
$("#login").onsubmit = async (e) => {
  e.preventDefault();
  let { error } = await sb.auth.signInWithPassword({
    email: $("#le").value,
    password: $("#lp").value,
  });
  $("#msg").textContent = error?.message || "";
};
$("#signup").onsubmit = async (e) => {
  e.preventDefault();
  let { error } = await sb.auth.signUp({
    email: $("#se").value,
    password: $("#sp").value,
    options: { data: { full_name: $("#sn").value } },
  });
  $("#msg").textContent = error?.message || "Konto utworzone.";
};
$("#menuBtn").onclick = (e) => {
  e.stopPropagation();
  $("#menu").classList.toggle("hide");
};
document.addEventListener(
  "click",
  (e) => !e.target.closest(".wrap") && $("#menu").classList.add("hide"),
);
$("#close").onclick = () => $("#dlg").close();
$("#dlg").addEventListener("click", (e) => {
  let r = $("#dlg").getBoundingClientRect();
  if (
    e.clientX < r.left ||
    e.clientX > r.right ||
    e.clientY < r.top ||
    e.clientY > r.bottom
  )
    $("#dlg").close();
});
$("#logout").onclick = () => sb.auth.signOut();
document
  .querySelectorAll("[data-v]")
  .forEach((b) => (b.onclick = () => view(b.dataset.v)));
function view(v) {
  document
    .querySelectorAll("[data-v]")
    .forEach((b) => b.classList.toggle("active", b.dataset.v === v));
  ({ dashboard: renderDashboard, pos: renderPOS, schedule: RS, bookings: RB, products: RP, team: renderEmployees, admin: renderSettings })[v]?.();
}
function topSchedule(title) {
  return `<div class="toolbar scheduleToolbar"><div><h2>${title}</h2><small>${S.mode === "week" ? "Grafik tygodniowy" : "Grafik miesięczny"}</small></div>${manage() ? '<button class="primary generateBtn" onclick="buildProposal()">Wygeneruj grafik</button>' : ""}</div><div class="navrow"><button class="ghost" onclick="moveSchedule(-1)">‹</button><button class="ghost" onclick="moveSchedule(0)">Dziś</button><button class="ghost" onclick="moveSchedule(1)">›</button></div><div class="modebar"><button class="ghost ${S.mode === "week" ? "active" : ""}" onclick="mode('week')">Tydzień</button><button class="ghost ${S.mode === "month" ? "active" : ""}" onclick="mode('month')">Miesiąc</button></div>${hoursSummary()}`;
}
function RS() {
  S.mode === "week" ? RW() : RM();
}
function RW() {
  let a = S.week;
  $("#content").innerHTML =
    topSchedule("Grafik tygodniowy") +
    `<div class="weekGrid">${[0, 1, 2, 3, 4, 5, 6]
      .map((i) => {
        let d = new Date(a);
        d.setDate(a.getDate() + i);
        let ds = ISO(d),
          r = visibleShifts().filter((x) => x.shift_date === ds);
        return `<section class="weekDay" onclick="openDay('${ds}')"><div class="weekHead"><b>${d.toLocaleDateString("pl-PL", { weekday: "long" })}</b><span class="dayNum">${d.getDate()}</span></div>${r.map((x) => `<div class="shift">${E(employeeLabel(x.employee_id))}<small>${x.start_time.slice(0, 5)}–${x.end_time.slice(0, 5)}</small></div>`).join("") || '<small class="muted">Brak zmian</small>'}</section>`;
      })
      .join("")}</div>`;
}
window.mode = (m) => {
  S.mode = m;
  RS();
};
window.moveSchedule = (n) => {
  if (!n) {
    S.week = weekStart(new Date());
    S.month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  } else if (S.mode === "week") S.week.setDate(S.week.getDate() + n * 7);
  else S.month = new Date(S.month.getFullYear(), S.month.getMonth() + n, 1);
  RS();
};
function cells(m, get, fn) {
  let f = new Date(m.getFullYear(), m.getMonth(), 1),
    s = new Date(f);
  s.setDate(f.getDate() - ((f.getDay() + 6) % 7));
  let o = "";
  for (let i = 0; i < 42; i++) {
    let d = new Date(s);
    d.setDate(s.getDate() + i);
    let ds = ISO(d),
      a = get(ds);
    o += `<div class="day ${d.getMonth() !== m.getMonth() ? "other" : ""} ${a.length ? "busy" : ""}" onclick="${fn}('${ds}')"><b>${d.getDate()}</b>${a.slice(0, 3).join("")}</div>`;
  }
  return o;
}
function RM() {
  $("#content").innerHTML =
    topSchedule("Grafik miesięczny") +
    `<div class="monthWrap"><div class="monthGrid">${["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"].map((x) => `<div class="dow">${x}</div>`).join("")}${cells(
      S.month,
      (ds) =>
        visibleShifts()
          .filter((x) => x.shift_date === ds)
          .map(
            (x) =>
              `<div class="entry">${E(employeeLabel(x.employee_id))}<span>${x.start_time.slice(0, 5)}–${x.end_time.slice(0, 5)}</span></div>`,
          ),
      "openDay",
    )}</div></div>`;
}
function off(id, ds) {
  return S.leave.some(
    (x) =>
      x.employee_id === id &&
      x.status === "approved" &&
      ds >= x.start_date &&
      ds <= x.end_date,
  );
}
window.openDay = (ds) => {
  let rows = visibleShifts().filter((x) => x.shift_date === ds),
    avail = S.employees.filter(
      (e) => !off(e.id, ds) && !rows.some((r) => r.employee_id === e.id),
    );
  M(
    new Date(ds + "T12:00").toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    `${manage() ? `<button type="button" class="primary dayAddButton" onclick="editShift(null,'${ds}')">+ Dodaj</button>` : ""}<div class="list dayShiftList">${rows.map((x) => `<div class="card"><div class="grow"><b>${E(employeeLabel(x.employee_id))}</b><small>${x.start_time.slice(0, 5)}–${x.end_time.slice(0, 5)}</small></div>${manage() ? `<button type="button" class="ghost" onclick="editShiftById('${x.id}','${ds}')">Edytuj</button><button type="button" class="danger" onclick="deleteShift('${x.id}','${ds}')">Usuń</button>` : ""}</div>`).join("")}</div>${manage() ? `<div class="available"><b>Dostępni</b><div class="chips">${avail.map((e) => `<button type="button" class="chip" onclick="quickAdd('${e.id}','${ds}')">+ ${E(e.full_name)}</button>`).join("") || '<span class="muted">Brak</span>'}</div></div>` : ""}`,
    async () => {},
    false,
  );
};
window.editShiftById = (id, ds) =>
  editShift(
    S.shifts.find((x) => x.id === id),
    ds,
  );
window.editShift = (r, ds) =>
  M(
    r ? "Edytuj zmianę" : "Dodaj zmianę",
    `<label>Pracownik</label><select id="ee">${S.employees
      .filter((e) => !off(e.id, ds) || e.id === r?.employee_id)
      .map((e) => `<option value="${e.id}">${E(e.full_name)}</option>`)
      .join(
        "",
      )}</select>${F("ed", "Dzień", "date", `value="${r?.shift_date || ds}"`)}${F("es", "Od", "time", `value="${r?.start_time?.slice(0, 5) || "12:00"}"`)}${F("en", "Do", "time", `value="${r?.end_time?.slice(0, 5) || "20:00"}"`)}`,
    async () => {
      let p = {
          employee_id: $("#ee").value,
          shift_date: $("#ed").value,
          start_time: $("#es").value,
          end_time: $("#en").value,
          created_by: S.u.id,
        },
        q = r
          ? sb.from("work_shifts").update(p).eq("id", r.id)
          : sb
              .from("work_shifts")
              .upsert(p, { onConflict: "employee_id,shift_date" }),
        { error } = await q;
      if (error) return alert(error.message);
      $("#dlg").close();
      await load();
      RS();
      toast("Grafik zapisany");
    },
  );
window.quickAdd = async (id, ds) => {
  let { error } = await sb.from("work_shifts").upsert(
    {
      employee_id: id,
      shift_date: ds,
      start_time: "12:00",
      end_time: "20:00",
      created_by: S.u.id,
    },
    { onConflict: "employee_id,shift_date" },
  );
  if (error) return alert(error.message);
  await load();
  openDay(ds);
};
window.deleteShift = async (id, ds) => {
  if (!confirm("Usunąć?")) return;
  await sb.from("work_shifts").delete().eq("id", id);
  await load();
  openDay(ds);
};
function currentMonth() {
  return S.mode === "month"
    ? S.month
    : new Date(S.week.getFullYear(), S.week.getMonth(), 1);
}
function assigned(id, a, b) {
  return S.shifts
    .filter(
      (x) => x.employee_id === id && x.shift_date >= a && x.shift_date <= b,
    )
    .reduce((q, x) => q + hours(x), 0);
}
window.buildProposal = () => {
  let m = currentMonth(),
    first = new Date(m.getFullYear(), m.getMonth(), 1),
    last = new Date(m.getFullYear(), m.getMonth() + 1, 0),
    a = ISO(first),
    b = ISO(last),
    draft = [];
  for (let i = 1; i <= last.getDate(); i++) {
    let d = new Date(m.getFullYear(), m.getMonth(), i),
      ds = ISO(d);
    if (d.getDay() === 0) continue;
    let eligible = S.employees.filter(
      (e) =>
        !off(e.id, ds) &&
        !S.shifts.some((x) => x.employee_id === e.id && x.shift_date === ds) &&
        !draft.some((x) => x.employee_id === e.id && x.shift_date === ds),
    );
    eligible.sort(
      (x, y) =>
        (assigned(x.id, a, b) +
          draft.filter((z) => z.employee_id === x.id).length * 8) /
          ((x.weekly_target_hours || 40) * 4.348) -
        (assigned(y.id, a, b) +
          draft.filter((z) => z.employee_id === y.id).length * 8) /
          ((y.weekly_target_hours || 40) * 4.348),
    );
    if (eligible[0])
      draft.push({
        key: crypto.randomUUID(),
        employee_id: eligible[0].id,
        shift_date: ds,
        start_time: "12:00",
        end_time: "20:00",
      });
  }
  S.proposal = draft;
  renderProposal();
};
function renderProposal() {
  M(
    "Propozycja grafiku",
    `<p class="muted">Zmień pracowników, daty lub godziny. Nic nie trafi do głównego grafiku przed zatwierdzeniem.</p><button type="button" class="ghost" onclick="addProposalRow()">+ Dodaj zmianę</button><div class="proposal">${S.proposal.map((r, i) => proposalRow(r, i)).join("")}</div><div class="proposalFooter"><button type="button" class="ghost" onclick="dlg.close()">Anuluj</button><button type="button" class="primary" onclick="approveProposal()">Zatwierdź grafik</button></div>`,
    async () => {},
    false,
  );
}
function proposalRow(r, i) {
  return `<div class="proposalRow"><input class="proposalDate" type="date" value="${r.shift_date}" onchange="proposalChange(${i},'shift_date',this.value)"><select class="proposalEmployee" onchange="proposalChange(${i},'employee_id',this.value)">${S.employees
    .filter((e) => !off(e.id, r.shift_date) || e.id === r.employee_id)
    .map(
      (e) =>
        `<option value="${e.id}" ${e.id === r.employee_id ? "selected" : ""}>${E(e.full_name)}</option>`,
    )
    .join(
      "",
    )}</select><input type="time" value="${r.start_time}" onchange="proposalChange(${i},'start_time',this.value)"><input type="time" value="${r.end_time}" onchange="proposalChange(${i},'end_time',this.value)"><button type="button" class="danger" onclick="removeProposal(${i})">✕</button></div>`;
}
window.proposalChange = (i, k, v) => {
  S.proposal[i][k] = v;
  if (k === "shift_date") renderProposal();
};
window.removeProposal = (i) => {
  S.proposal.splice(i, 1);
  renderProposal();
};
window.addProposalRow = () => {
  let d = S.proposal.at(-1)?.shift_date || ISO(new Date());
  S.proposal.push({
    key: crypto.randomUUID(),
    employee_id: S.employees[0]?.id,
    shift_date: d,
    start_time: "12:00",
    end_time: "20:00",
  });
  renderProposal();
};
window.approveProposal = async () => {
  if (!S.proposal.length) return alert("Brak zmian do zatwierdzenia.");
  for (let r of S.proposal)
    if (off(r.employee_id, r.shift_date))
      return alert("Jeden z pracowników ma zatwierdzone wolne.");
  let rows = S.proposal.map(({ key, ...r }) => ({ ...r, created_by: S.u.id })),
    { error } = await sb.from("work_shifts").insert(rows);
  if (error) return alert(error.message);
  S.proposal = [];
  $("#dlg").close();
  await load();
  RS();
  toast("Grafik zatwierdzony");
};
function placeName(x) {
  return x.reservation_places?.name || x.place_name || x.room || "Bez przypisanego miejsca";
}
function placeOptions(selected="") {
  const active=S.reservationPlaces.filter(p=>p.active!==false || p.id===selected);
  return active.map(p=>`<option value="${p.id}" ${p.id===selected?"selected":""}>${E(p.name)}${p.capacity?` • do ${p.capacity} os.`:""}</option>`).join("");
}
function RB() {
  const week=S.bookingWeek, mode=S.bookingMode;
  const header=`<div class="toolbar"><h2>Rezerwacje</h2><div class="actions">${manage()?'<button class="ghost" onclick="renderReservationPlaces()">Miejsca</button>':""}<button class="primary" onclick="BF()">+ Rezerwacja</button></div></div><div class="reservationControls"><div class="modebar"><button class="ghost ${mode==="week"?"active":""}" onclick="bookingMode('week')">Tydzień</button><button class="ghost ${mode==="month"?"active":""}" onclick="bookingMode('month')">Miesiąc</button></div><div class="navrow"><button class="ghost" onclick="moveBookings(-1)">‹</button><button class="ghost" onclick="moveBookings(0)">Dziś</button><button class="ghost" onclick="moveBookings(1)">›</button></div></div>`;
  if(mode==="week") $("#content").innerHTML=header+`<div class="bookingWeek">${[0,1,2,3,4,5,6].map(i=>{const d=new Date(week);d.setDate(week.getDate()+i);const ds=ISO(d),rows=S.bookings.filter(x=>x.start_at.slice(0,10)===ds);return `<section class="bookingDay"><button class="bookingDayHead" onclick="BD('${ds}')"><b>${d.toLocaleDateString("pl-PL",{weekday:"long"})}</b><span>${d.getDate()}.${d.getMonth()+1}</span></button>${rows.map(bookingCard).join("")||'<small class="muted">Brak rezerwacji</small>'}</section>`}).join("")}</div>`;
  else $("#content").innerHTML=header+`<div class="monthWrap"><div class="monthGrid reservationMonth">${["Pon","Wt","Śr","Czw","Pt","Sob","Nd"].map(x=>`<div class="dow">${x}</div>`).join("")}${cells(S.bm,ds=>S.bookings.filter(x=>x.start_at.slice(0,10)===ds).map(x=>`<div class="entry">${new Date(x.start_at).toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit"})} • ${x.guests_count} os.<span>${E(placeName(x))}</span></div>`),"BD")}</div></div>`;
}
function bookingCard(x){return `<button class="bookingCard" onclick="editBookingById('${x.id}')"><b>${new Date(x.start_at).toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit"})} • ${E(x.title)}</b><small>${x.guests_count} os. • ${E(placeName(x))}${x.table_label?` • stolik ${E(x.table_label)}`:""}</small></button>`}
window.bookingMode=m=>{S.bookingMode=m;localStorage.setItem("cafeBookingMode",m);RB()};
window.moveBookings=n=>{if(!n){S.bookingWeek=weekStart(new Date());S.bm=new Date(new Date().getFullYear(),new Date().getMonth(),1)}else if(S.bookingMode==="week")S.bookingWeek.setDate(S.bookingWeek.getDate()+n*7);else S.bm=new Date(S.bm.getFullYear(),S.bm.getMonth()+n,1);RB()};
window.MB=n=>{S.bm=new Date(S.bm.getFullYear(),S.bm.getMonth()+n,1);RB()};
window.BF=()=>{
 if(!S.reservationPlaces.filter(p=>p.active!==false).length)return alert("Najpierw kierownik lub administrator musi dodać przynajmniej jedno miejsce rezerwacji.");
 let t=new Date();t.setDate(t.getDate()+1);
 M("Nowa rezerwacja",`${F("bn","Nazwa / nazwisko","","required")}${F("bg","Liczba osób","number","min=\"1\" required")}<label>Miejsce</label><select id="bp" required><option value="">Wybierz miejsce</option>${placeOptions()}</select>${F("bt","Stolik / oznaczenie","","placeholder=\"np. 4, okno, narożnik\"")}${F("ba","Data i godzina","datetime-local",`value="${ISO(t)}T18:00" required`)}`,async()=>{
  const a=new Date($("#ba").value),z=new Date(a.getTime()+7200000),place=S.reservationPlaces.find(p=>p.id===$("#bp").value);
  const {error}=await sb.from("bookings").insert({title:$("#bn").value,guests_count:+$("#bg").value,reservation_place_id:$("#bp").value,place_name:place?.name||null,room:place?.name||null,table_label:$("#bt").value.trim()||null,start_at:a.toISOString(),end_at:z.toISOString(),created_by:S.u.id});
  if(error)return alert(error.message);$("#dlg").close();await load();RB();await addLog("Dodano rezerwację","Rezerwacje");toast("Rezerwacja dodana");
 });
};
window.BD=ds=>M(new Date(ds+"T12:00").toLocaleDateString("pl-PL",{weekday:"long",day:"numeric",month:"long"}),`<div class="list">${S.bookings.filter(x=>x.start_at.slice(0,10)===ds).map(x=>`<div class="card"><div class="grow"><b>${E(x.title)}</b><small>${new Date(x.start_at).toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit"})} • ${x.guests_count} os. • ${E(placeName(x))}${x.table_label?` • stolik ${E(x.table_label)}`:""}</small></div><div class="actions"><button type="button" class="ghost" onclick="editBookingById('${x.id}')">Edytuj</button><button type="button" class="danger" onclick="deleteBooking('${x.id}','${ds}')">Usuń</button></div></div>`).join("")||'<span class="muted">Brak rezerwacji</span>'}</div>`,async()=>{},false);
window.editBookingById=id=>{const r=S.bookings.find(x=>x.id===id),d=new Date(r.start_at),v=`${ISO(d)}T${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;M("Edytuj rezerwację",`${F("ebn","Nazwa / nazwisko","","required")}${F("ebg","Liczba osób","number","min=\"1\" required")}<label>Miejsce</label><select id="ebp" required>${placeOptions(r.reservation_place_id)}</select>${F("ebt","Stolik / oznaczenie","",`value="${E(r.table_label||"")}"`)}${F("eba","Data i godzina","datetime-local",`value="${v}" required`)}`,async()=>{const a=new Date($("#eba").value),z=new Date(a.getTime()+7200000),place=S.reservationPlaces.find(p=>p.id===$("#ebp").value),{error}=await sb.from("bookings").update({title:$("#ebn").value,guests_count:+$("#ebg").value,reservation_place_id:$("#ebp").value,place_name:place?.name||null,room:place?.name||null,table_label:$("#ebt").value.trim()||null,start_at:a.toISOString(),end_at:z.toISOString()}).eq("id",id);if(error)return alert(error.message);$("#dlg").close();await load();RB();toast("Rezerwacja zaktualizowana")});setTimeout(()=>{$("#ebn").value=r.title;$("#ebg").value=r.guests_count},0)};
window.deleteBooking=async(id,ds)=>{if(!confirm("Usunąć rezerwację?"))return;const{error}=await sb.from("bookings").delete().eq("id",id);if(error)return alert(error.message);await load();BD(ds);toast("Rezerwacja usunięta")};
function renderReservationPlaces(){if(!manage())return;$("#content").innerHTML=`<div class="toolbar"><div><h2>Miejsca rezerwacji</h2><small>Sale, piętra, stoliki lub dowolne nazwy używane w lokalu.</small></div><button class="primary" onclick="placeForm()">+ Dodaj miejsce</button></div><div class="placeGrid">${S.reservationPlaces.map(p=>`<div class="placeCard ${p.active===false?"placeInactive":""}"><div class="grow"><b>${E(p.name)}</b><small>${p.capacity?`Do ${p.capacity} osób • `:""}${p.active===false?"Wyłączone":"Aktywne"}</small>${p.description?`<p>${E(p.description)}</p>`:""}</div><div class="actions"><button class="ghost" onclick="placeForm('${p.id}')">Edytuj</button><button class="danger" onclick="deletePlace('${p.id}')">Usuń</button></div></div>`).join("")||'<p class="muted">Nie dodano jeszcze miejsc.</p>'}</div><button class="ghost" onclick="RB()">← Wróć do rezerwacji</button>`}
window.placeForm = (id = null) => {
  const p = S.reservationPlaces.find(x => x.id === id);
  const nameAttrs = 'value="' + E(p?.name || '') + '" required placeholder="np. Mała sala, Góra, Taras"';
  const capAttrs = 'min="1" value="' + (p?.capacity || '') + '"';
  const fields = F("pln", "Nazwa miejsca", "", nameAttrs) + F("plc", "Maksymalna liczba osób", "number", capAttrs) + '<label>Opis</label><textarea id="pld" placeholder="Opcjonalny opis miejsca">' + E(p?.description || '') + '</textarea>' + '<label class="checkRow"><input id="pla" type="checkbox" ' + (p?.active === false ? '' : 'checked') + '> Miejsce aktywne i dostępne przy nowych rezerwacjach</label>';
  M(p ? "Edytuj miejsce" : "Dodaj miejsce", fields, async () => {
    const payload = {name: $("#pln").value.trim(), capacity: +$("#plc").value || null, description: $("#pld").value.trim() || null, active: $("#pla").checked, updated_at: new Date().toISOString()};
    const q = p ? sb.from("reservation_places").update(payload).eq("id", p.id) : sb.from("reservation_places").insert({...payload, created_by: S.u.id});
    const {error} = await q;
    if (error) return alert(error.message);
    $("#dlg").close(); await load(); renderReservationPlaces(); toast(p ? "Miejsce zaktualizowane" : "Miejsce dodane");
  });
};
window.deletePlace=async id=>{const used=S.bookings.some(x=>x.reservation_place_id===id);if(used){if(!confirm("To miejsce jest używane w rezerwacjach. Zamiast kasować zostanie wyłączone. Kontynuować?"))return;const{error}=await sb.from("reservation_places").update({active:false}).eq("id",id);if(error)return alert(error.message)}else{if(!confirm("Usunąć to miejsce?"))return;const{error}=await sb.from("reservation_places").delete().eq("id",id);if(error)return alert(error.message)}await load();renderReservationPlaces();toast(used?"Miejsce wyłączone":"Miejsce usunięte")};

function RP() {
  $("#content").innerHTML =
    `<div class="toolbar"><h2>Produkty</h2><button class="primary" onclick="PF()">+ Dodaj</button></div><div class="list">${S.products.map((x) => `<div class="card"><div class="grow"><b>${E(x.title)}</b><small>${E(x.quantity || "")}</small></div><div class="actions"><button class="ghost" onclick="editProduct('${x.id}')">Edytuj</button><button class="danger" onclick="deleteProduct('${x.id}')">Usuń</button></div></div>`).join("") || '<p class="muted">Brak produktów.</p>'}</div>`;
}
window.PF = () =>
  M(
    "Produkt",
    `${F("pn", "Nazwa", "", "required")}${F("pq", "Ilość")}`,
    async () => {
      let { error } = await sb.from("shopping").insert({
        title: $("#pn").value,
        quantity: $("#pq").value,
        created_by: S.u.id,
      });
      if (error) return alert(error.message);
      $("#dlg").close();
      await load();
      RP();
      await addLog("Dodano produkt", "Produkty");
      toast("Produkt dodany");
    },
  );
window.editProduct = (id) => {
  let r = S.products.find((x) => x.id === id);
  M(
    "Edytuj produkt",
    `${F("epn", "Nazwa", "", "required")}${F("epq", "Ilość")}`,
    async () => {
      let { error } = await sb
        .from("shopping")
        .update({ title: $("#epn").value, quantity: $("#epq").value })
        .eq("id", id);
      if (error) return alert(error.message);
      $("#dlg").close();
      await load();
      RP();
      await addLog("Edytowano produkt", "Produkty", { id });
      toast("Produkt zaktualizowany");
    },
  );
  setTimeout(() => {
    $("#epn").value = r.title;
    $("#epq").value = r.quantity || "";
  }, 0);
};
window.deleteProduct = async (id) => {
  if (!confirm("Usunąć produkt?")) return;
  let { error } = await sb.from("shopping").delete().eq("id", id);
  if (error) return alert(error.message);
  await load();
  RP();
  await addLog("Usunięto produkt", "Produkty", { id });
  toast("Produkt usunięty");
};
function renderEmployees() {
  $("#content").innerHTML =
    `<div class="toolbar"><h2>Pracownicy i godziny</h2><button class="primary" onclick="employeeForm()">+ Dodaj</button></div>${managerDashboard()}<div class="list">${S.employees.map((e) => `<div class="card"><div class="grow"><b>${E(e.full_name)}</b><small class="employeeMeta">${E(e.email || "Brak e-mail")} • ${E(e.phone || "Brak telefonu")} • ${e.contract_percent || 100}% etatu • ${Number(e.hourly_rate||0).toFixed(2)} zł/h</small></div><div class="actions"><button class="ghost" onclick="employeeFormById('${e.id}')">Edytuj</button><button class="danger" onclick="deleteEmployee('${e.id}')">Usuń</button></div></div>`).join("")}</div>`;
}
window.employeeFormById = (id) =>
  employeeForm(S.employees.find((e) => e.id === id));
window.employeeForm = (r = null) => {
  M(
    r ? "Panel pracownika" : "Dodaj pracownika",
    `<div class="employeeFormGrid"><div>${F("empn", "Imię i nazwisko", "", "required")}</div><div>${F("empe", "E-mail", "email")}</div><div>${F("empphone", "Telefon", "tel")}</div><div><label>Etat</label><select id="empp"><option value="100">100%</option><option value="75">75%</option><option value="50">50%</option><option value="25">25%</option></select></div><div>${F("emprate", "Stawka godzinowa", "number", "min=\"0\" step=\"0.01\"")}</div><div style="grid-column:1/-1"><label>Powiązane konto</label><select id="empprofile"><option value="">Bez konta</option>${S.profiles.map((p) => `<option value="${p.id}">${E(p.full_name || "Użytkownik")}</option>`).join("")}</select></div></div>`,
    async () => {
      let btn = $("#save");
      if (btn.classList.contains("busySubmit")) return;
      btn.classList.add("busySubmit");
      try {
        let name = $("#empn").value.trim(),
          dup = S.employees.find(
            (x) =>
              x.id !== r?.id &&
              x.full_name.trim().toLowerCase() === name.toLowerCase(),
          );
        if (dup) return alert("Ten pracownik już istnieje.");
        let pct = +$("#empp").value,
          payload = {
            full_name: name,
            email: $("#empe").value.trim() || null,
            phone: $("#empphone").value.trim() || null,
            contract_percent: pct,
            weekly_target_hours: pct * 0.4,
            profile_id: $("#empprofile").value || null,
          },
          q = r
            ? sb.from("employees").update(payload).eq("id", r.id)
            : sb.from("employees").insert(payload),
          { error } = await q;
        if (error) return alert(error.message);
        await addLog(
          r ? "Edytowano pracownika" : "Dodano pracownika",
          "Pracownicy",
          { name },
        );
        $("#dlg").close();
        await load();
        renderEmployees();
        toast(r ? "Pracownik zaktualizowany" : "Pracownik dodany");
      } finally {
        btn.classList.remove("busySubmit");
      }
    },
  );
  setTimeout(() => {
    if (r) {
      $("#empn").value = r.full_name || "";
      $("#empe").value = r.email || "";
      $("#empphone").value = r.phone || "";
      $("#empp").value = String(r.contract_percent || 100); $("#emprate").value = r.hourly_rate || 0;
      $("#empprofile").value = r.profile_id || "";
    }
  }, 0);
};
window.deleteEmployee = async (id) => {
  if (!confirm("Usunąć pracownika?")) return;
  let { error } = await sb.from("employees").delete().eq("id", id);
  if (error) return alert(error.message);
  await addLog("Usunięto pracownika", "Pracownicy", { id });
  await load();
  renderEmployees();
  toast("Pracownik usunięty");
};
async function addLog(action, module, details = {}) {
  try {
    await sb.from("activity_logs").insert({
      user_id: S.u?.id || null,
      user_email: S.u?.email || null,
      action,
      module,
      details,
    });
  } catch (e) {
    console.warn("Log unavailable", e);
  }
}
window.renderLogs = () => {
  let modules = [...new Set(S.logs.map((x) => x.module).filter(Boolean))];
  M(
    "Logi",
    `<div class="logFilters"><select id="logmodule" onchange="drawLogs()"><option value="">Wszystkie moduły</option>${modules.map((x) => `<option>${E(x)}</option>`).join("")}</select><select id="logorder" onchange="drawLogs()"><option value="new">Najnowsze</option><option value="old">Najstarsze</option></select></div><div id="loglist" class="list"></div>`,
    async () => {},
    false,
  );
  drawLogs();
};
window.drawLogs = () => {
  let module = $("#logmodule")?.value || "",
    rows = S.logs.filter((x) => !module || x.module === module);
  if ($("#logorder")?.value === "old") rows = [...rows].reverse();
  $("#loglist").innerHTML =
    rows
      .map(
        (x) =>
          `<div class="card"><div class="grow"><b>${E(x.action)}</b><small>${E(x.user_email || "Użytkownik")} • ${E(x.module || "")} • ${new Date(x.created_at).toLocaleString("pl-PL")}</small></div></div>`,
      )
      .join("") || '<p class="muted">Brak logów.</p>';
};
function renderSettings() {
  $("#content").innerHTML =
    `<div class="toolbar"><h2>Ustawienia administratora</h2></div>
  <div class="adminGrid"><section class="glass adminSection"><h3>Konta i role</h3><p class="muted">Zarządzaj dostępem, rolami i resetem hasła.</p><div class="accountRows">${S.profiles.map((p) => `<div class="adminAccount"><div class="grow"><b>${E(p.full_name || "Użytkownik")}</b><small>${E(p.email || "Brak e-mail")}</small></div><select class="roleSelect" onchange="changeRole('${p.id}',this.value)" ${p.id === S.u.id ? "disabled" : ""}><option value="user" ${p.role === "user" ? "selected" : ""}>Pracownik</option><option value="manager" ${p.role === "manager" ? "selected" : ""}>Kierownik</option><option value="admin" ${p.role === "admin" ? "selected" : ""}>Administrator</option></select><button class="ghost" onclick="resetUserPassword('${p.id}')">Reset hasła</button><button class="${p.active === false ? "primary" : "danger"}" onclick="toggleUser('${p.id}',${p.active === false})">${p.active === false ? "Odblokuj" : "Zablokuj"}</button></div>`).join("")}</div></section>
  <section class="glass adminSection"><h3>Ogłoszenia</h3><p class="muted">Komunikat pokaże się użytkownikom po zalogowaniu.</p><textarea id="announcementText" placeholder="Treść ogłoszenia"></textarea><button class="primary" onclick="publishAnnouncement()">Opublikuj</button>${S.announcements
    .slice(0, 3)
    .map(
      (a) =>
        `<div class="card"><div class="grow"><b>Ogłoszenie</b><small>${new Date(a.created_at).toLocaleString("pl-PL")}</small><p>${E(a.message || a.content || "")}</p></div></div>`,
    )
    .join("")}</section>
  <section class="glass adminSection"><h3>Rezerwacje i miejsca</h3><p class="muted">Kierownik i administrator mogą dodawać, edytować, wyłączać i usuwać miejsca.</p><button class="primary" onclick="renderReservationPlaces()">Zarządzaj miejscami rezerwacji</button></section><section class="glass adminSection"><h3>Kontrola systemu</h3><button class="card" onclick="renderLogs()"><div class="grow" style="text-align:left"><b>📜 Historia zmian</b><small>Aktywność administracyjna</small></div></button><div class="card"><div class="grow"><b>Zgłoszone błędy</b><small>${S.bugs.length}</small></div></div>${S.bugs.map((b) => `<div class="card"><div class="grow"><b>${E(b.title)}</b><small>${new Date(b.created_at).toLocaleString("pl-PL")}</small><p>${E(b.details)}</p></div><button class="danger" onclick="deleteBug('${b.id}')">Usuń</button></div>`).join("") || '<p class="muted">Brak zgłoszeń.</p>'}</section></div>`;
}
window.changeRole = async (id, role) => {
  let { error } = await sb.from("profiles").update({ role }).eq("id", id);
  if (error) return alert(error.message);
  await load();
  renderSettings();
  toast("Rola zmieniona");
};
window.deleteBug = async (id) => {
  if (!confirm("Usunąć zgłoszenie?")) return;
  let { error } = await sb.from("bug_reports").delete().eq("id", id);
  if (error) return alert(error.message);
  await load();
  renderSettings();
};
$("#quick").onclick = () => PF();
$("#account").onclick = () => renderMyPanel();
$("#settings").onclick = () => {
  if (S.p.role === "admin") renderSettings();
};
$("#employees").onclick = () => {
  if (manage()) renderEmployees();
};

function currentEmployee() {
  const email = (S.p?.email || S.u?.email || "").toLowerCase();
  return S.employees.find(
    (e) =>
      e.user_id === S.u?.id ||
      e.profile_id === S.u?.id ||
      (e.email || "").toLowerCase() === email ||
      e.full_name === S.p?.full_name,
  );
}
function visibleShifts() {
  if (manage()) return S.shifts;
  const e = currentEmployee();
  return e ? S.shifts.filter((x) => x.employee_id === e.id) : [];
}
function monthRange(d = new Date()) {
  const a = new Date(d.getFullYear(), d.getMonth(), 1),
    b = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return [ISO(a), ISO(b)];
}
function sumHours(rows) {
  return rows.reduce((n, x) => n + Math.max(0, hours(x)), 0);
}
function hoursSummary() {
  const [a, b] = monthRange(S.mode === "month" ? S.month : S.week);
  const rows = visibleShifts().filter(
    (x) => x.shift_date >= a && x.shift_date <= b,
  );
  if (!manage())
    return `<div class="hoursHero"><span>Twoje godziny w miesiącu</span><strong>${sumHours(rows).toFixed(2).replace(".", ",")} h</strong></div>`;
  const cards = S.employees
    .map((e) => {
      const h = sumHours(rows.filter((x) => x.employee_id === e.id));
      return `<div class="hourMini"><span>${E(e.full_name)}</span><b>${h.toFixed(2).replace(".", ",")} h</b></div>`;
    })
    .join("");
  return `<details class="hoursDetails"><summary>Podsumowanie godzin pracowników</summary><div class="hourMiniGrid">${cards}</div></details>`;
}
function managerDashboard() {
  const [a, b] = monthRange();
  return `<div class="statsGrid">${S.employees
    .map((e) => {
      const rows = S.shifts.filter(
        (x) => x.employee_id === e.id && x.shift_date >= a && x.shift_date <= b,
      );
      return `<div class="statCard"><span>${E(e.full_name)}</span><strong>${sumHours(rows).toFixed(2).replace(".", ",")} h</strong><small>${rows.length} zmian w tym miesiącu</small></div>`;
    })
    .join("")}</div>`;
}
function renderMyPanel() {
  const e = currentEmployee();
  const mine = e ? S.shifts.filter((x) => x.employee_id === e.id) : [];
  const [a, b] = monthRange();
  $("#content").innerHTML =
    `<div class="toolbar"><h2>Moje konto</h2></div><div class="statsGrid"><div class="statCard"><span>Godziny w tym miesiącu</span><strong>${sumHours(
      mine.filter((x) => x.shift_date >= a && x.shift_date <= b),
    )
      .toFixed(2)
      .replace(
        ".",
        ",",
      )} h</strong></div><div class="statCard"><span>Zaplanowane zmiany</span><strong>${mine.filter((x) => x.shift_date >= ISO(new Date())).length}</strong></div></div><div class="selfGrid"><section class="glass adminSection"><h3>Moja dyspozycyjność</h3><div class="availabilityForm"><input id="avDate" type="date" value="${ISO(new Date())}"><input id="avFrom" type="time" value="10:00"><input id="avTo" type="time" value="22:00"><select id="avStatus"><option value="available">Dostępny</option><option value="unavailable">Niedostępny</option></select><button class="primary" onclick="saveAvailability()">Zapisz dyspozycję</button></div>${
      S.availability
        .filter((x) => x.user_id === S.u.id || x.employee_id === e?.id)
        .slice(0, 12)
        .map(
          (x) =>
            `<div class="card"><div class="grow"><b>${x.work_date}</b><small>${x.status === "available" ? "Dostępny" : "Niedostępny"} ${x.start_time ? `• ${x.start_time.slice(0, 5)}–${x.end_time.slice(0, 5)}` : ""}</small></div></div>`,
        )
        .join("") || '<p class="muted">Brak zgłoszonej dyspozycyjności.</p>'
    }</section><section class="glass adminSection"><h3>Wnioski i zamiany</h3><button class="ghost" onclick="requestTimeOff()">+ Wniosek o wolne</button><button class="ghost" onclick="requestSwap()">⇄ Poproś o zamianę zmiany</button><p class="muted">Wnioski trafiają do kierownika do zatwierdzenia.</p></section></div>`;
}
window.saveAvailability = async () => {
  const e = currentEmployee();
  const payload = {
    user_id: S.u.id,
    employee_id: e?.id || null,
    work_date: $("#avDate").value,
    start_time: $("#avFrom").value,
    end_time: $("#avTo").value,
    status: $("#avStatus").value,
  };
  const { error } = await sb
    .from("availability")
    .upsert(payload, { onConflict: "user_id,work_date" });
  if (error)
    return alert(
      "Moduł dyspozycyjności wymaga tabeli availability w Supabase. " +
        error.message,
    );
  await load();
  renderMyPanel();
  toast("Dyspozycyjność zapisana");
};
window.requestTimeOff = () =>
  M(
    "Wniosek o wolne",
    `${F("lof", "Od", "date", "required")}${F("lot", "Do", "date", "required")}<label>Powód</label><textarea id="lor"></textarea>`,
    async () => {
      const e = currentEmployee();
      const { error } = await sb
        .from("time_off_requests")
        .insert({
          employee_id: e?.id,
          start_date: $("#lof").value,
          end_date: $("#lot").value,
          reason: $("#lor").value,
          status: "pending",
        });
      if (error) return alert(error.message);
      $("#dlg").close();
      toast("Wniosek wysłany");
    },
  );
window.requestSwap = () => {
  const e = currentEmployee();
  const future = S.shifts.filter(
    (x) => x.employee_id === e?.id && x.shift_date >= ISO(new Date()),
  );
  M(
    "Zamiana zmiany",
    `<label>Zmiana</label><select id="swapShift">${future.map((x) => `<option value="${x.id}">${x.shift_date} • ${x.start_time.slice(0, 5)}–${x.end_time.slice(0, 5)}</option>`).join("")}</select><label>Wiadomość</label><textarea id="swapNote"></textarea>`,
    async () => {
      const { error } = await sb
        .from("shift_swaps")
        .insert({
          shift_id: $("#swapShift").value,
          requested_by: S.u.id,
          note: $("#swapNote").value,
          status: "pending",
        });
      if (error)
        return alert(
          "Moduł zamian wymaga tabeli shift_swaps w Supabase. " + error.message,
        );
      $("#dlg").close();
      toast("Prośba o zamianę wysłana");
    },
  );
};
window.resetUserPassword = async (id) => {
  const p = S.profiles.find((x) => x.id === id);
  if (!p?.email) return alert("To konto nie ma zapisanego adresu e-mail.");
  const { error } = await sb.auth.resetPasswordForEmail(p.email, {
    redirectTo: location.origin + location.pathname,
  });
  if (error) return alert(error.message);
  toast("Wysłano link do resetu hasła");
};
window.toggleUser = async (id, active) => {
  const { error } = await sb.from("profiles").update({ active }).eq("id", id);
  if (error)
    return alert(
      "Pole active nie jest jeszcze dostępne w profiles. " + error.message,
    );
  await load();
  renderSettings();
  toast(active ? "Konto odblokowane" : "Konto zablokowane");
};
window.publishAnnouncement = async () => {
  const message = $("#announcementText").value.trim();
  if (!message) return;
  const { error } = await sb
    .from("announcements")
    .insert({ message, created_by: S.u.id });
  if (error)
    return alert(
      "Moduł ogłoszeń wymaga tabeli announcements w Supabase. " + error.message,
    );
  await load();
  renderSettings();
  toast("Ogłoszenie opublikowane");
};
function showLatestAnnouncement() {
  const a = S.announcements[0];
  if (!a) return;
  const key = `announcement:${a.id}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  M(
    "Wiadomość od administracji",
    `<div class="announcementText">${E(a.message || a.content || "")}</div>`,
    async () => {},
    false,
  );
  if ("Notification" in window && Notification.permission === "granted")
    new Notification("Café Strych", {
      body: a.message || a.content || "Nowe ogłoszenie",
    });
}

let liveReloadTimer;
function liveReload() {
  clearTimeout(liveReloadTimer);
  liveReloadTimer = setTimeout(async () => {
    await load();
    let active =
      document.querySelector("[data-v].active")?.dataset.v || "schedule";
    view(active);
  }, 180);
}
sb.channel("cafe-strych-live")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "employees" },
    liveReload,
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "work_shifts" },
    liveReload,
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "bookings" },
    liveReload,
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "shopping" },
    liveReload,
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "profiles" },
    liveReload,
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "activity_logs" },
    liveReload,
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "availability" },
    liveReload,
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "announcements" },
    liveReload,
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "shift_swaps" },
    liveReload,
  )
  .subscribe();
sb.auth.onAuthStateChange((_e, s) => setTimeout(() => boot(s), 0));
sb.auth.getSession().then(({ data }) => boot(data.session));



/* Cafe Strych 2.4.0: accounts, profiles, contracts, online status, admin navigation */
const APP_VERSION="3.0.1 HOTFIX";
function splitName(v){const p=String(v||"").trim().split(/\s+/);return {first:p[0]||"Pracownik",last:p.slice(1).join(" ")}}
function employeeLabel(id){const e=S.employees.find(x=>x.id===id);if(!e)return "Pracownik";const n=splitName(e.full_name);const same=S.employees.filter(x=>splitName(x.full_name).first.toLocaleLowerCase("pl")===n.first.toLocaleLowerCase("pl"));return same.length>1&&n.last?`${n.first} ${n.last[0].toUpperCase()}.`:n.first}
async function markOnline(){if(!S.u)return;await sb.from("profiles").update({last_seen_at:new Date().toISOString(),email:S.u.email}).eq("id",S.u.id)}
setInterval(markOnline,60000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)markOnline()});
const oldBoot=boot;boot=async function(s){await oldBoot(s);if(S.u){await markOnline();const e=currentEmployee();if(e&&(!e.email||e.user_id!==S.u.id)){await sb.from("employees").update({email:S.u.email,user_id:S.u.id}).eq("id",e.id);await load()}}};
function onlineText(p){if(!p.last_seen_at)return "Brak danych";const d=new Date(p.last_seen_at),sec=(Date.now()-d)/1000;if(sec<120)return "Online teraz";return "Ostatnio online: "+d.toLocaleString("pl-PL")}
window.openEmployeeProfile=async id=>{const e=S.employees.find(x=>x.id===id);if(!e)return;const profile=S.profiles.find(p=>p.id===e.user_id||p.email===e.email);const {data:docs}=await sb.from("employment_contracts").select("*").eq("employee_id",id).order("created_at",{ascending:false});const contracts=docs||[];$("#content").innerHTML=`<div class="toolbar"><div><h2>${E(e.full_name)}</h2><small>${E(e.email||profile?.email||"Brak e-mail")}</small></div><button class="ghost" onclick="renderEmployees()">← Pracownicy</button></div><div class="profileGrid"><section class="glass adminSection"><h3>Dane pracownika</h3><div class="profileFacts"><div><span>Rola</span><b>${E(profile?.role||"user")}</b></div><div><span>Status</span><b>${E(onlineText(profile||{}))}</b></div><div><span>Telefon</span><b>${E(e.phone||"Brak")}</b></div></div></section><section class="glass adminSection"><h3>Umowy o pracę</h3>${manage()?`<label class="uploadContract primary">+ Dodaj skan lub zdjęcie<input type="file" accept="image/*,.pdf" onchange="uploadContract('${id}',this.files[0])"></label>`:""}<div class="list">${contracts.map(c=>`<div class="card"><div class="grow"><b>${E(c.file_name)}</b><small>${new Date(c.created_at).toLocaleString("pl-PL")}</small></div><button class="ghost" onclick="openContract('${c.storage_path}')">Otwórz</button>${manage()?`<button class="danger" onclick="deleteContract('${c.id}','${c.storage_path}','${id}')">Usuń</button>`:""}</div>`).join("")||'<p class="muted">Brak dodanych umów.</p>'}</div></section></div>`};
window.uploadContract=async(id,file)=>{if(!file)return;if(file.size>12*1024*1024)return alert("Maksymalny rozmiar pliku to 12 MB.");const ext=file.name.split('.').pop().toLowerCase(),path=`${id}/${crypto.randomUUID()}.${ext}`;const up=await sb.storage.from("employment-contracts").upload(path,file,{contentType:file.type,upsert:false});if(up.error)return alert(up.error.message);const ins=await sb.from("employment_contracts").insert({employee_id:id,file_name:file.name,storage_path:path,uploaded_by:S.u.id});if(ins.error){await sb.storage.from("employment-contracts").remove([path]);return alert(ins.error.message)}openEmployeeProfile(id);toast("Umowa dodana")};
window.openContract=async path=>{const {data,error}=await sb.storage.from("employment-contracts").createSignedUrl(path,300);if(error)return alert(error.message);window.open(data.signedUrl,"_blank","noopener")};
window.deleteContract=async(id,path,eid)=>{if(!confirm("Usunąć ten dokument?"))return;const r=await sb.from("employment_contracts").delete().eq("id",id);if(r.error)return alert(r.error.message);await sb.storage.from("employment-contracts").remove([path]);openEmployeeProfile(eid)};
const oldRenderEmployees=renderEmployees;renderEmployees=function(){oldRenderEmployees();document.querySelectorAll("#content .card").forEach((card,i)=>{const e=S.employees[i];if(!e)return;card.classList.add("employeeClickable");card.addEventListener("click",ev=>{if(ev.target.closest("button,select,input"))return;openEmployeeProfile(e.id)})})};
function renderAdminShell(tab="accounts"){$("#content").innerHTML=`<div class="adminShell"><aside class="adminNav"><button class="${tab==='accounts'?'active':''}" onclick="renderAdminShell('accounts')">Konta</button><button class="${tab==='employees'?'active':''}" onclick="renderAdminShell('employees')">Pracownicy</button><button class="${tab==='reservations'?'active':''}" onclick="renderAdminShell('reservations')">Rezerwacje</button><button class="${tab==='messages'?'active':''}" onclick="renderAdminShell('messages')">Ogłoszenia</button><button class="${tab==='logs'?'active':''}" onclick="renderAdminShell('logs')">Aktywność</button><button class="${tab==='system'?'active':''}" onclick="renderAdminShell('system')">System</button></aside><section id="adminPane"></section></div>`;const pane=$("#adminPane");if(tab==="accounts")pane.innerHTML=`<div class="toolbar"><h2>Konta użytkowników</h2></div><div class="accountRows">${S.profiles.map(p=>`<div class="adminAccount"><button class="profileOpen grow" onclick="openProfileByAccount('${p.id}')"><b>${E(p.full_name||"Użytkownik")}</b><small>${E(p.email||"Brak e-mail")} • ${E(onlineText(p))}</small></button><select class="roleSelect" onchange="changeRole('${p.id}',this.value)" ${p.id===S.u.id?'disabled':''}><option value="user" ${p.role==='user'?'selected':''}>Pracownik</option><option value="manager" ${p.role==='manager'?'selected':''}>Kierownik</option><option value="admin" ${p.role==='admin'?'selected':''}>Administrator</option></select><button class="ghost" onclick="resetUserPassword('${p.id}')">Reset hasła</button></div>`).join("")}</div>`;else if(tab==="employees"){renderEmployees()}else if(tab==="reservations"){renderReservationPlaces()}else if(tab==="messages")pane.innerHTML=`<h2>Ogłoszenia</h2><textarea id="announcementText" placeholder="Treść ogłoszenia"></textarea><button class="primary" onclick="publishAnnouncement()">Opublikuj</button>`;else if(tab==="logs"){renderLogs()}else pane.innerHTML=`<h2>System</h2><div class="statCard"><span>Wersja aplikacji</span><strong>${APP_VERSION}</strong></div><p class="muted">Wersja zmienia się przy każdej aktualizacji plików aplikacji.</p>`}
renderSettings=function(){renderAdminShell("accounts")};
window.openProfileByAccount=id=>{const p=S.profiles.find(x=>x.id===id),e=S.employees.find(x=>x.user_id===id||x.email===p?.email);if(e)openEmployeeProfile(e.id);else alert("To konto nie ma jeszcze połączonego pracownika.")};
setTimeout(()=>{const v=document.querySelector("#appVersion");if(v)v.textContent=`Wersja ${APP_VERSION}`},0);
setTimeout(()=>{const a=document.querySelector('#account');if(a)a.onclick=()=>{const e=currentEmployee();if(e)openEmployeeProfile(e.id);else renderMyPanel()}},0);


/* ===== CAFE STRYCH PRO 3.0: dashboard, POS, QR, rooms, finance ===== */
function money(v){return Number(v||0).toLocaleString('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2})+' zł'}
function orderItems(id){return S.orderItems.filter(x=>x.order_id===id)}
function orderTotal(o){return orderItems(o.id).reduce((n,x)=>n+Number(x.qty)*Number(x.unit_price),0)}
function todayISO(){return ISO(new Date())}
function renderDashboard(){
 const today=todayISO(), todayOrders=S.orders.filter(o=>(o.created_at||'').slice(0,10)===today), paid=todayOrders.filter(o=>o.status==='paid');
 const revenue=paid.reduce((n,o)=>n+orderTotal(o),0), active=S.orders.filter(o=>!['paid','cancelled'].includes(o.status));
 const bookings=S.bookings.filter(b=>(b.start_at||'').slice(0,10)===today);
 $('#content').innerHTML=`<div class="toolbar"><div><h2>Centrum dowodzenia</h2><small>Dzisiaj • ${new Date().toLocaleDateString('pl-PL')}</small></div><button class="primary" onclick="newOrder()">+ Nowy rachunek</button></div>
 <div class="kpiGrid"><button class="kpi" onclick="renderPOS()"><span>Sprzedaż dzisiaj</span><strong>${money(revenue)}</strong><small>${paid.length} zamkniętych rachunków</small></button><button class="kpi" onclick="renderPOS()"><span>Aktywne zamówienia</span><strong>${active.length}</strong><small>kuchnia i bar</small></button><button class="kpi" onclick="view('bookings')"><span>Rezerwacje dzisiaj</span><strong>${bookings.length}</strong><small>${bookings.reduce((n,b)=>n+Number(b.guests_count||0),0)} gości</small></button><button class="kpi" onclick="renderEmployees()"><span>Pracownicy</span><strong>${S.employees.length}</strong><small>aktywnych kont</small></button></div>
 <div class="dashboardGrid"><section class="glass adminSection"><div class="sectionHead"><h3>Aktualne rachunki</h3><button class="ghost" onclick="renderPOS()">Otwórz POS</button></div>${active.slice(0,8).map(orderCard).join('')||'<p class="muted">Brak aktywnych rachunków.</p>'}</section><section class="glass adminSection"><h3>Dzisiejsze rezerwacje</h3>${bookings.map(bookingCard).join('')||'<p class="muted">Brak rezerwacji.</p>'}</section></div>`;
}
function orderCard(o){const t=S.tables.find(x=>x.id===o.table_id);return `<button class="orderCard status-${o.status}" onclick="openOrder('${o.id}')"><div><b>${E(o.order_no||'Rachunek')}</b><small>${E(t?.label||o.customer_name||'Sprzedaż bez stolika')} • ${E(o.status)}</small></div><strong>${money(orderTotal(o))}</strong></button>`}
function renderPOS(){
 const active=S.orders.filter(o=>!['paid','cancelled'].includes(o.status));
 $('#content').innerHTML=`<div class="toolbar"><div><h2>POS i zamówienia</h2><small>Rachunki, bar, kuchnia i płatności</small></div><div class="actions"><button class="ghost" onclick="renderMenuAdmin()">Menu</button><button class="ghost" onclick="renderRoomsAdmin()">Sale i stoliki</button><button class="primary" onclick="newOrder()">+ Rachunek</button></div></div><div class="posStatus"><button onclick="filterOrders('all')">Wszystkie</button><button onclick="filterOrders('new')">Nowe</button><button onclick="filterOrders('preparing')">W przygotowaniu</button><button onclick="filterOrders('ready')">Gotowe</button></div><div id="ordersGrid" class="ordersGrid">${active.map(orderCard).join('')||'<p class="muted">Brak otwartych rachunków.</p>'}</div>`;
}
window.filterOrders=st=>{const a=S.orders.filter(o=>!['paid','cancelled'].includes(o.status)&&(st==='all'||o.status===st));$('#ordersGrid').innerHTML=a.map(orderCard).join('')||'<p class="muted">Brak zamówień.</p>'}
window.newOrder=()=>{M('Nowy rachunek',`<label>Stolik</label><select id="ot"><option value="">Bez stolika / na wynos</option>${S.tables.filter(t=>t.active!==false).map(t=>`<option value="${t.id}">${E(t.label)}</option>`).join('')}</select>${F('oc','Nazwa klienta / opis','','placeholder="opcjonalnie"')}`,async()=>{const no='CS-'+new Date().toISOString().replace(/\D/g,'').slice(2,14),{data,error}=await sb.from('pos_orders').insert({order_no:no,table_id:$('#ot').value||null,customer_name:$('#oc').value.trim()||null,status:'new',source:'pos',created_by:S.u.id}).select().single();if(error)return alert(error.message);$('#dlg').close();await load();openOrder(data.id)})}
window.openOrder=id=>{const o=S.orders.find(x=>x.id===id);if(!o)return;const items=orderItems(id),cats=[...new Set(S.menuItems.filter(x=>x.active!==false).map(x=>x.category||'Inne'))];$('#content').innerHTML=`<div class="toolbar"><div><button class="ghost" onclick="renderPOS()">← POS</button><h2>${E(o.order_no)}</h2><small>${E(o.status)} • ${new Date(o.created_at).toLocaleString('pl-PL')}</small></div><strong class="grandTotal">${money(orderTotal(o))}</strong></div><div class="posLayout"><section><div class="categoryTabs">${cats.map(c=>`<button onclick="showMenuCategory('${E(c)}')">${E(c)}</button>`).join('')}</div><div id="menuTiles" class="menuTiles">${menuTiles(cats[0],id)}</div></section><aside class="ticket"><h3>Rachunek</h3>${items.map(i=>`<div class="ticketRow"><div><b>${E(i.item_name)}</b><small>${i.qty} × ${money(i.unit_price)}</small></div><div><b>${money(i.qty*i.unit_price)}</b><button class="danger mini" onclick="removeOrderItem('${i.id}','${id}')">×</button></div></div>`).join('')||'<p class="muted">Dodaj pozycje z menu.</p>'}<div class="ticketTotal"><span>Razem</span><strong>${money(orderTotal(o))}</strong></div><div class="orderActions"><button class="ghost" onclick="setOrderStatus('${id}','preparing')">Przygotowanie</button><button class="ghost" onclick="setOrderStatus('${id}','ready')">Gotowe</button><button class="primary" onclick="payOrder('${id}')">Płatność</button></div></aside></div>`;window.__openOrder=id}
function menuTiles(cat,id){return S.menuItems.filter(x=>x.active!==false&&(!cat||(x.category||'Inne')===cat)).map(x=>`<button class="menuTile" onclick="addOrderItem('${id}','${x.id}')"><span>${E(x.name)}</span><strong>${money(x.price)}</strong><small>${E(x.category||'Inne')}</small></button>`).join('')||'<p class="muted">Brak produktów w kategorii.</p>'}
window.showMenuCategory=cat=>{$('#menuTiles').innerHTML=menuTiles(cat,window.__openOrder)}
window.addOrderItem=async(oid,mid)=>{const m=S.menuItems.find(x=>x.id===mid),old=orderItems(oid).find(x=>x.menu_item_id===mid);const q=old?sb.from('pos_order_items').update({qty:Number(old.qty)+1}).eq('id',old.id):sb.from('pos_order_items').insert({order_id:oid,menu_item_id:mid,item_name:m.name,qty:1,unit_price:m.price,tax_rate:m.tax_rate||23});const{error}=await q;if(error)return alert(error.message);await load();openOrder(oid)}
window.removeOrderItem=async(id,oid)=>{await sb.from('pos_order_items').delete().eq('id',id);await load();openOrder(oid)}
window.setOrderStatus=async(id,status)=>{const{error}=await sb.from('pos_orders').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)return alert(error.message);await load();openOrder(id)}
window.payOrder=id=>{const total=orderTotal(S.orders.find(x=>x.id===id));M('Finalizacja płatności',`<div class="payTotal">${money(total)}</div><label>Metoda</label><select id="pm"><option value="card">Karta</option><option value="cash">Gotówka</option><option value="blik">BLIK</option><option value="transfer">Przelew</option></select>${F('pt','Napiwek','number','min="0" step="0.01" value="0"')}`,async()=>{const{error}=await sb.from('pos_payments').insert({order_id:id,amount:total,tip_amount:+$('#pt').value||0,method:$('#pm').value,created_by:S.u.id});if(error)return alert(error.message);await sb.from('pos_orders').update({status:'paid',closed_at:new Date().toISOString()}).eq('id',id);$('#dlg').close();await load();renderPOS();toast('Rachunek opłacony')})}
window.renderMenuAdmin=()=>{$('#content').innerHTML=`<div class="toolbar"><div><button class="ghost" onclick="renderPOS()">← POS</button><h2>Menu sprzedażowe</h2></div><button class="primary" onclick="menuForm()">+ Produkt</button></div><div class="menuAdminGrid">${S.menuItems.map(x=>`<div class="card"><div class="grow"><b>${E(x.name)}</b><small>${E(x.category||'Inne')} • ${money(x.price)} • VAT ${x.tax_rate||23}%</small></div><button class="ghost" onclick="menuForm('${x.id}')">Edytuj</button></div>`).join('')}</div>`}
window.menuForm=(id=null)=>{const r=S.menuItems.find(x=>x.id===id);M(r?'Edytuj produkt':'Nowy produkt',`${F('mn','Nazwa','','required')}${F('mc','Kategoria','','required')}${F('mp','Cena','number','min="0" step="0.01" required')}${F('mv','VAT %','number','min="0" value="23"')}<label class="checkRow"><input id="ma" type="checkbox" checked> Aktywny w sprzedaży i QR</label>`,async()=>{const p={name:$('#mn').value.trim(),category:$('#mc').value.trim(),price:+$('#mp').value,tax_rate:+$('#mv').value,active:$('#ma').checked,updated_at:new Date().toISOString()},q=r?sb.from('menu_items').update(p).eq('id',id):sb.from('menu_items').insert({...p,created_by:S.u.id}),{error}=await q;if(error)return alert(error.message);$('#dlg').close();await load();renderMenuAdmin()});setTimeout(()=>{if(r){$('#mn').value=r.name;$('#mc').value=r.category;$('#mp').value=r.price;$('#mv').value=r.tax_rate||23;$('#ma').checked=r.active!==false}},0)}
window.renderRoomsAdmin=()=>{$('#content').innerHTML=`<div class="toolbar"><div><button class="ghost" onclick="renderPOS()">← POS</button><h2>Sale i stoliki</h2></div><div class="actions"><button class="ghost" onclick="roomForm()">+ Sala</button><button class="primary" onclick="tableForm()">+ Stolik</button></div></div>${S.rooms.map(r=>`<section class="roomBlock"><div class="sectionHead"><div><h3>${E(r.name)}</h3><small>do ${r.capacity||'—'} osób</small></div><button class="ghost" onclick="roomForm('${r.id}')">Edytuj</button></div><div class="tableGrid">${S.tables.filter(t=>t.room_id===r.id).map(t=>`<button class="tableAdmin" onclick="tableForm('${t.id}')"><b>${E(t.label)}</b><small>${t.seats||0} miejsc</small><span>${t.qr_token?'QR aktywny':'Brak QR'}</span></button>`).join('')||'<p class="muted">Brak stolików.</p>'}</div></section>`).join('')}`}
window.roomForm=(id=null)=>{const r=S.rooms.find(x=>x.id===id);M(r?'Edytuj salę':'Nowa sala',`${F('rn','Nazwa','','required')}${F('rc','Pojemność','number','min="1"')}`,async()=>{const p={name:$('#rn').value.trim(),capacity:+$('#rc').value||null},q=r?sb.from('cafe_rooms').update(p).eq('id',id):sb.from('cafe_rooms').insert(p),{error}=await q;if(error)return alert(error.message);$('#dlg').close();await load();renderRoomsAdmin()});setTimeout(()=>{if(r){$('#rn').value=r.name;$('#rc').value=r.capacity||''}},0)}
window.tableForm=(id=null)=>{const r=S.tables.find(x=>x.id===id);M(r?'Edytuj stolik':'Nowy stolik',`<label>Sala</label><select id="tr">${S.rooms.map(x=>`<option value="${x.id}">${E(x.name)}</option>`).join('')}</select>${F('tl','Nazwa / numer','','required')}${F('ts','Liczba miejsc','number','min="1" value="4"')}<label class="checkRow"><input id="ta" type="checkbox" checked> Aktywny</label>`,async()=>{const p={room_id:$('#tr').value,label:$('#tl').value.trim(),seats:+$('#ts').value||4,active:$('#ta').checked,qr_token:r?.qr_token||crypto.randomUUID()},q=r?sb.from('cafe_tables').update(p).eq('id',id):sb.from('cafe_tables').insert(p),{error}=await q;if(error)return alert(error.message);$('#dlg').close();await load();renderRoomsAdmin()});setTimeout(()=>{if(r){$('#tr').value=r.room_id;$('#tl').value=r.label;$('#ts').value=r.seats;$('#ta').checked=r.active!==false}},0)}

/* ===== CAFE STRYCH 3.2.0 OPERATIONS PRO ===== */
const PRO_VERSION='3.2.0 OPERATIONS PRO';
S.appSettings={qr_enabled:false}; S.permissions=[]; S.inventory=[];
const baseLoad=load;
load=async function(){
 await baseLoad();
 const extra=await Promise.all([
  sb.from('cafe_settings').select('*').limit(1).maybeSingle(),
  sb.from('employee_permissions').select('*'),
  sb.from('inventory_items').select('*').order('name')
 ]);
 S.appSettings=extra[0].error?{qr_enabled:false}:(extra[0].data||{qr_enabled:false});
 S.permissions=extra[1].error?[]:(extra[1].data||[]);
 S.inventory=extra[2].error?[]:(extra[2].data||[]);
};
function perm(key){if(S.p?.role==='admin'||S.p?.role==='manager')return true;const e=currentEmployee();const r=S.permissions.find(x=>x.employee_id===e?.id);return !!r?.[key]}
function applyRoleUI(){
 const admin= S.p?.role==='admin', mgr=S.p?.role==='manager';
 document.querySelector('[data-v="pos"]')?.classList.toggle('hide',!(admin||mgr||perm('can_pos')));
 document.querySelector('[data-v="bookings"]')?.classList.toggle('hide',!(admin||mgr||perm('can_bookings')));
 $('#quick')?.classList.toggle('hide',!(admin||mgr||perm('can_shopping')));
}
const baseBoot=boot;boot=async function(s){await baseBoot(s);if(S.u){applyRoleUI();view('dashboard')}};
function employeeHome(){
 const e=currentEmployee(), mine=e?(S.shifts||[]).filter(x=>x.employee_id===e.id):[], upcoming=mine.filter(x=>x.shift_date>=ISO(new Date())).sort((a,b)=>a.shift_date.localeCompare(b.shift_date));
 $('#content').innerHTML=`<div class="welcomeHero"><div><small>Panel pracownika</small><h2>Cześć, ${E(S.p?.full_name||'')}</h2><p>Twój grafik, komunikaty i najważniejsze działania w jednym miejscu.</p></div><div class="roleBadge">PRACOWNIK</div></div><div class="employeeDash"><section class="dashPanel"><h3>📅 Najbliższa zmiana</h3>${upcoming[0]?`<strong>${upcoming[0].shift_date}</strong><p>${upcoming[0].start_time.slice(0,5)}–${upcoming[0].end_time.slice(0,5)}</p>`:'<p class="muted">Brak zaplanowanej zmiany.</p>'}</section><section class="dashPanel"><h3>📢 Komunikaty</h3>${(S.announcements||[]).slice(0,3).map(a=>`<p>${E(a.message||a.content||'')}</p>`).join('')||'<p class="muted">Brak nowych komunikatów.</p>'}</section><section class="dashPanel"><h3>⏱ Moje godziny</h3><strong>${sumHours(mine.filter(x=>x.shift_date>=monthRange()[0]&&x.shift_date<=monthRange()[1])).toFixed(2)} h</strong></section><section class="dashPanel actionsPanel"><h3>Moje działania</h3><button onclick="renderMyPanel()">Dyspozycyjność i wnioski</button><button onclick="view('schedule')">Otwórz grafik</button></section></div>`;
}
const managerHome=renderDashboard;
renderDashboard=function(){if(!manage())return employeeHome();managerHome();const h=$('#content .toolbar h2');if(h)h.textContent=S.p?.role==='admin'?'🏠 Centrum administratora':'🏠 Pulpit kierownika'};
function renderInventory(){
 $('#content').innerHTML=`<div class="toolbar"><div><h2>📦 Magazyn</h2><small>Stany magazynowe i lista zakupów</small></div>${manage()?'<button class="primary" onclick="inventoryForm()">+ Produkt magazynowy</button>':''}</div><div class="inventoryTabs"><button class="active">Magazyn</button><button onclick="RP()">🛒 Lista zakupów</button></div><div class="inventoryGrid">${(S.inventory||[]).map(x=>`<div class="inventoryCard ${Number(x.quantity)<=Number(x.min_quantity)?'lowStock':''}"><div><b>${E(x.name)}</b><small>${E(x.category||'Inne')}</small></div><strong>${x.quantity} ${E(x.unit||'szt.')}</strong><small>Minimum: ${x.min_quantity||0}</small>${manage()?`<button onclick="inventoryForm('${x.id}')">Edytuj</button>`:''}</div>`).join('')||'<p class="muted">Brak produktów magazynowych.</p>'}</div>`;
}
window.inventoryForm=(id=null)=>{const r=S.inventory.find(x=>x.id===id);M(r?'Edytuj produkt magazynowy':'Produkt magazynowy',`${F('in','Nazwa','','required')}${F('ic','Kategoria','','required')}${F('iq','Stan','number','step="0.01" required')}${F('iu','Jednostka','','value="szt."')}${F('im','Stan minimalny','number','step="0.01" value="0"')}`,async()=>{const p={name:$('#in').value.trim(),category:$('#ic').value.trim(),quantity:+$('#iq').value,unit:$('#iu').value.trim(),min_quantity:+$('#im').value},q=r?sb.from('inventory_items').update(p).eq('id',id):sb.from('inventory_items').insert(p),{error}=await q;if(error)return alert(error.message);$('#dlg').close();await load();renderInventory()});setTimeout(()=>{if(r){$('#in').value=r.name;$('#ic').value=r.category;$('#iq').value=r.quantity;$('#iu').value=r.unit;$('#im').value=r.min_quantity}},0)};
function wholeRoomForm(){
 M('Wynajem całej sali',`${F('wrn','Imię i nazwisko','','required')}${F('wrt','Telefon','tel','required')}${F('wrd','Data i godzina','datetime-local','required')}<label>Sala</label><select id="wrr">${(S.rooms||[]).map(r=>`<option value="${r.id}">${E(r.name)}</option>`).join('')}</select>${F('wrg','Liczba gości','number','min="1" required')}${F('wra','Kwota zadatku','number','min="0" step="0.01" value="0"')}<label>Uwagi</label><textarea id="wrnote"></textarea>`,async()=>{const room=(S.rooms||[]).find(x=>x.id===$('#wrr').value),a=new Date($('#wrd').value),z=new Date(a.getTime()+4*3600000);const{error}=await sb.from('bookings').insert({title:$('#wrn').value,customer_phone:$('#wrt').value,guests_count:+$('#wrg').value,room:room?.name,place_name:room?.name,start_at:a.toISOString(),end_at:z.toISOString(),deposit_amount:+$('#wra').value||0,whole_room:true,booking_status:'confirmed',notes:$('#wrnote').value,created_by:S.u.id});if(error)return alert(error.message);$('#dlg').close();await load();RB();toast('Wynajem sali zapisany')})
}
window.wholeRoomForm=wholeRoomForm;
const oldRB=RB;RB=function(){oldRB();if(manage()){const a=$('#content .toolbar .actions');if(a)a.insertAdjacentHTML('afterbegin','<button class="ghost" onclick="wholeRoomForm()">🏛 Wynajmij całą salę</button>')}};
window.toggleQR=async()=>{const enabled=!S.appSettings.qr_enabled;const p={id:1,qr_enabled:enabled,updated_at:new Date().toISOString()}, {error}=await sb.from('cafe_settings').upsert(p);if(error)return alert(error.message);S.appSettings=p;renderSettings();toast(enabled?'Zamawianie QR włączone':'Zamawianie QR wyłączone')};
window.permissionEditor=id=>{const e=S.employees.find(x=>x.id===id),r=S.permissions.find(x=>x.employee_id===id)||{};M(`Dostęp: ${E(e?.full_name)}`,['can_pos','can_bookings','can_schedule','can_inventory','can_shopping'].map((k,i)=>`<label class="permissionRow"><input type="checkbox" id="p${i}" ${r[k]?'checked':''}> ${['Obsługa POS','Rezerwacje','Grafik','Magazyn','Lista zakupów'][i]}</label>`).join(''),async()=>{const p={employee_id:id,can_pos:$('#p0').checked,can_bookings:$('#p1').checked,can_schedule:$('#p2').checked,can_inventory:$('#p3').checked,can_shopping:$('#p4').checked},{error}=await sb.from('employee_permissions').upsert(p,{onConflict:'employee_id'});if(error)return alert(error.message);$('#dlg').close();await load();renderEmployees();toast('Dostępy zapisane')})};
const employeeBase=renderEmployees;renderEmployees=function(){employeeBase();if(manage())document.querySelectorAll('#content .card').forEach((c,i)=>{const e=S.employees[i];if(e)c.querySelector('.actions')?.insertAdjacentHTML('afterbegin',`<button class="ghost" onclick="event.stopPropagation();permissionEditor('${e.id}')">Dostępy</button>`)})};
function targetedAnnouncement(){const options=S.employees.map((e,i)=>`<label class="permissionRow"><input class="recipientPick" type="checkbox" value="${e.id}"> ${E(e.full_name)}</label>`).join('');M('Nowy komunikat',`<label>Treść</label><textarea id="tam" required></textarea><div class="recipientHead"><b>Odbiorcy</b><button type="button" class="ghost" onclick="document.querySelectorAll('.recipientPick').forEach(x=>x.checked=true)">Zaznacz wszystkich</button></div><div class="recipientList">${options}</div>`,async()=>{const ids=[...document.querySelectorAll('.recipientPick:checked')].map(x=>x.value);if(!ids.length)return alert('Wybierz co najmniej jednego pracownika.');const{error}=await sb.from('announcements').insert({message:$('#tam').value.trim(),created_by:S.u.id,target_employee_ids:ids});if(error)return alert(error.message);$('#dlg').close();await load();toast('Komunikat wysłany')})}
window.targetedAnnouncement=targetedAnnouncement;
const settingsBase=renderSettings;renderSettings=function(){if(S.p.role!=='admin')return settingsBase();$('#content').innerHTML=`<div class="toolbar"><div><h2>⚙️ Ustawienia administratora</h2><small>Konfiguracja funkcji, dostępu i lokalu</small></div><span class="versionPill">${PRO_VERSION}</span></div><div class="settingsGrid"><section class="settingsCard"><h3>📱 Zamawianie QR</h3><p>Funkcja jest obecnie <b>${S.appSettings.qr_enabled?'WŁĄCZONA':'WYŁĄCZONA'}</b>.</p><button class="${S.appSettings.qr_enabled?'danger':'primary'}" onclick="toggleQR()">${S.appSettings.qr_enabled?'Wyłącz zamawianie QR':'Włącz zamawianie QR'}</button></section><section class="settingsCard"><h3>👥 Konta i dostępy</h3><p>Ustawiaj indywidualne uprawnienia pracowników.</p><button onclick="renderEmployees()">Zarządzaj pracownikami</button></section><section class="settingsCard"><h3>🏛 Sale i stoliki</h3><p>Administrator i kierownik mogą zmieniać nazwy sal.</p><button onclick="renderRoomsAdmin()">Edytuj sale</button></section><section class="settingsCard"><h3>📢 Komunikaty</h3><p>Wyślij komunikat do jednej lub kilku osób.</p><button onclick="targetedAnnouncement()">Nowy komunikat</button></section><section class="settingsCard"><h3>📦 Magazyn</h3><p>Stany, minima i osobna lista zakupów.</p><button onclick="renderInventory()">Otwórz magazyn</button></section><section class="settingsCard"><h3>🧾 POS</h3><p>Menu, rachunki, płatności i stoliki.</p><button onclick="renderPOS()">Otwórz POS</button></section></div>`};
window.renderInventory=renderInventory;
setTimeout(()=>{const p=document.querySelector('[data-v="pos"]');if(p)p.innerHTML='🧾<small>POS</small>';const d=document.querySelector('[data-v="dashboard"]');if(d)d.innerHTML='🏠<small>Start</small>';const pr=document.querySelector('[data-v="products"]');if(pr){pr.dataset.v='inventory';pr.innerHTML='📦<small>Magazyn</small>';pr.onclick=()=>{document.querySelectorAll('[data-v]').forEach(x=>x.classList.toggle('active',x===pr));renderInventory()}};const footer=$('#appVersion');if(footer)footer.textContent='Wersja '+PRO_VERSION},0);

/* ===== Cafe Strych 3.4.0 CONTROL PRO ===== */
(()=>{
 const navMap={dashboard:'dashboard',pos:'pos',schedule:'schedule',bookings:'bookings',inventory:'inventory'};
 function setActive(v){document.querySelectorAll('[data-v]').forEach(b=>b.classList.toggle('active',b.dataset.v===v));}
 function currentEmp(){return typeof currentEmployee==='function'?currentEmployee():null}
 function orderRows(id){return (S.orderItems||[]).filter(x=>x.order_id===id)}
 function friendlyOrder(o){const t=(S.tables||[]).find(x=>x.id===o.table_id);return o.customer_name?.trim()||t?.label||'Na wynos'}
 function orderMini(o){const rows=orderRows(o.id);return `<button class="orderCard" onclick="openOrder('${o.id}')"><div class="grow"><b>${E(friendlyOrder(o))}</b><small>${E(o.order_no||'Rachunek')}</small><div class="simpleOrderItems">${rows.map(i=>`<span class="simpleOrderItem"><span>${Number(i.qty)} × ${E(i.item_name)}</span><b>${money(Number(i.qty)*Number(i.unit_price))}</b></span>`).join('')||'<small>Rachunek jest pusty</small>'}</div></div><strong>${money(orderTotal(o))}</strong></button>`}
 const baseView=view;view=function(v){setActive(navMap[v]||v);if(v==='inventory')return renderInventoryView('stock');return baseView(v)};window.view=view;
 const baseOpenOrder=window.openOrder;window.openOrder=id=>{setActive('pos');baseOpenOrder(id);const o=(S.orders||[]).find(x=>x.id===id),h=document.querySelector('#content .toolbar h2');if(h&&o)h.textContent=friendlyOrder(o)};
 const basePOS=renderPOS;renderPOS=function(){setActive('pos');const open=(S.orders||[]).filter(o=>!['paid','cancelled'].includes(o.status));document.querySelector('#content').innerHTML=`<div class="toolbar"><div><h2>🧾 Otwarte rachunki</h2><small>Prosta lista sprzedaży bez etapów baru i kuchni</small></div><div class="actions"><button class="ghost" onclick="renderMenuAdmin()">Menu</button><button class="primary" onclick="newOrder()">+ Rachunek</button></div></div><div class="compactGrid">${open.map(orderMini).join('')||'<p class="muted">Brak otwartych rachunków.</p>'}</div>`};window.renderPOS=renderPOS;
 function tabs(active){return `<div class="inventoryTabs"><button class="${active==='stock'?'active':''}" onclick="renderInventoryView('stock')">📦 Magazyn</button><button class="${active==='shopping'?'active':''}" onclick="renderInventoryView('shopping')">🛒 Lista zakupów</button></div>`}
 window.renderInventoryView=function(mode='stock'){setActive('inventory');if(mode==='shopping'){document.querySelector('#content').innerHTML=`<div class="toolbar"><div><h2>🛒 Lista zakupów</h2><small>Rzeczy potrzebne do zamówienia</small></div><button class="primary" onclick="PF()">+ Dodaj</button></div>${tabs('shopping')}<div class="list">${(S.products||[]).map(x=>`<div class="card"><div class="grow"><b>${E(x.title)}</b><small>${E(x.quantity||'')}</small></div><div class="actions"><button class="ghost" onclick="editProduct('${x.id}')">Edytuj</button><button class="danger" onclick="deleteProduct('${x.id}')">Usuń</button></div></div>`).join('')||'<p class="muted">Lista zakupów jest pusta.</p>'}</div>`;return}document.querySelector('#content').innerHTML=`<div class="toolbar"><div><h2>📦 Magazyn</h2><small>Aktualne stany magazynowe</small></div>${manage()?'<button class="primary" onclick="inventoryForm()">+ Produkt magazynowy</button>':''}</div>${tabs('stock')}<div class="inventoryGrid">${(S.inventory||[]).map(x=>`<div class="inventoryCard ${Number(x.quantity)<=Number(x.min_quantity)?'lowStock':''}"><div><b>${E(x.name)}</b><small>${E(x.category||'Inne')}</small></div><strong>${x.quantity} ${E(x.unit||'szt.')}</strong><small>Minimum: ${x.min_quantity||0}</small>${manage()?`<button onclick="inventoryForm('${x.id}')">Edytuj</button>`:''}</div>`).join('')||'<p class="muted">Brak produktów magazynowych.</p>'}</div>`};
 renderInventory=()=>renderInventoryView('stock');window.renderInventory=renderInventory;
 const oldPF=window.PF,oldEdit=window.editProduct,oldDelete=window.deleteProduct;
 function returnShopping(fn){return async(...a)=>{await fn(...a);setTimeout(()=>renderInventoryView('shopping'),0)}}
 if(oldPF)window.PF=()=>{oldPF();const f=document.querySelector('#form'),prev=f.onsubmit;f.onsubmit=async e=>{await prev(e);setTimeout(()=>renderInventoryView('shopping'),0)}};
 const statusName=p=>{if(!p?.last_seen_at)return 'Brak danych o aktywności';const d=new Date(p.last_seen_at),online=Date.now()-d.getTime()<120000;return online?'Online teraz':'Ostatnio: '+d.toLocaleString('pl-PL')};
 function employeeAccount(e){const p=(S.profiles||[]).find(x=>x.id===e.profile_id||x.id===e.user_id||(x.email&&e.email&&x.email.toLowerCase()===e.email.toLowerCase()));return {e,p}}
 function financeSummary(date=ISO(new Date())){const orders=(S.orders||[]).filter(o=>(o.closed_at||o.created_at||'').slice(0,10)===date&&o.status==='paid'),ids=new Set(orders.map(o=>o.id)),pay=(S.payments||[]).filter(p=>ids.has(p.order_id));const sum=m=>pay.filter(p=>p.method===m).reduce((n,p)=>n+Number(p.amount||0)+Number(p.tip_amount||0),0);return {total:pay.reduce((n,p)=>n+Number(p.amount||0)+Number(p.tip_amount||0),0),cash:sum('cash'),card:sum('card'),other:pay.filter(p=>!['cash','card'].includes(p.method)).reduce((n,p)=>n+Number(p.amount||0)+Number(p.tip_amount||0),0),count:orders.length}}
 window.renderAdminCenter=function(tab='employees'){
  if(!manage())return;const isAdmin=S.p?.role==='admin',items=[['employees','👥','Pracownicy'],['activity','🟢','Aktywność'],['finance','💰','Utarg'],['places','🏛️','Sale i stoliki'],['messages','📢','Komunikaty'],['qr','📱','QR']].filter(x=>isAdmin||!['qr'].includes(x[0]));document.querySelector('#content').innerHTML=`<div class="adminTop"><div><h2>${isAdmin?'Ustawienia administratora':'Panel kierownika'}</h2><small class="muted">Zarządzanie lokalem i pracownikami</small></div><button class="ghost" onclick="view('dashboard')">← Start</button></div><div class="adminShellV2"><aside class="adminNavV2">${items.map(x=>`<button class="${tab===x[0]?'active':''}" onclick="renderAdminCenter('${x[0]}')">${x[1]} ${x[2]}</button>`).join('')}</aside><section id="adminPaneV2" class="adminPaneV2"></section></div>`;const pane=document.querySelector('#adminPaneV2');
  if(tab==='employees')pane.innerHTML=`<h3>👥 Pracownicy, konta i dostępy</h3><p class="muted">Jedna lista do zarządzania danymi, kontem, rolą i uprawnieniami.</p>${(S.employees||[]).map(e=>{const {p}=employeeAccount(e);return `<div class="employeeControl"><div class="employeeControlHead"><div><b>${E(e.full_name)}</b><small class="muted">${E(e.email||p?.email||'Brak e-mail')} • ${E(p?.role||'Brak konta')} • ${E(statusName(p))}</small></div><div class="actions"><button class="ghost" onclick="openEmployeeControl('${e.id}')">Otwórz konto</button>${isAdmin?`<button class="ghost" onclick="permissionEditor('${e.id}')">Dostępy</button>`:''}</div></div></div>`}).join('')}`;
  if(tab==='activity')pane.innerHTML=`<h3>🟢 Aktywność pracowników</h3>${(S.employees||[]).map(e=>{const {p}=employeeAccount(e),on=p?.last_seen_at&&Date.now()-new Date(p.last_seen_at).getTime()<120000;return `<div class="compactRow"><div><span class="activityDot ${on?'online':''}"></span><b>${E(e.full_name)}</b><small class="muted">${E(statusName(p))}</small></div><button class="ghost" onclick="openEmployeeControl('${e.id}')">Szczegóły</button></div>`}).join('')}`;
  if(tab==='finance'){const f=financeSummary();pane.innerHTML=`<div class="toolbar"><div><h3>💰 Utarg dzienny</h3><small>Podział według zapisanych płatności</small></div><input id="financeDate" type="date" value="${ISO(new Date())}" onchange="renderFinanceDay(this.value)"></div><div id="financeDay">${financeHtml(f)}</div>`}
  if(tab==='places'){setTimeout(()=>renderRoomsInsideAdmin(),0)}
  if(tab==='messages')pane.innerHTML=`<h3>📢 Komunikat do pracowników</h3><button class="primary" onclick="targetedAnnouncement()">+ Nowy komunikat</button><div class="list">${(S.announcements||[]).slice(0,10).map(a=>`<div class="card"><div><b>${E(a.message||a.content||'')}</b><small>${new Date(a.created_at).toLocaleString('pl-PL')}</small></div></div>`).join('')}</div>`;
  if(tab==='qr')pane.innerHTML=`<section class="settingsCard"><h3>📱 Zamawianie QR</h3><p>Stan: <b>${S.appSettings?.qr_enabled?'WŁĄCZONE':'WYŁĄCZONE'}</b></p><button class="${S.appSettings?.qr_enabled?'danger':'primary'}" onclick="toggleQR()">${S.appSettings?.qr_enabled?'Wyłącz':'Włącz'}</button></section>`;
 };
 function financeHtml(f){return `<div class="financeGrid"><div class="financeCard"><span>Łącznie</span><strong>${money(f.total)}</strong><small>${f.count} rachunków</small></div><div class="financeCard"><span>Gotówka</span><strong>${money(f.cash)}</strong></div><div class="financeCard"><span>Karta</span><strong>${money(f.card)}</strong></div><div class="financeCard"><span>Inne</span><strong>${money(f.other)}</strong></div></div>`}window.renderFinanceDay=date=>{document.querySelector('#financeDay').innerHTML=financeHtml(financeSummary(date))};
 window.openEmployeeControl=id=>{const {e,p}=employeeAccount((S.employees||[]).find(x=>x.id===id));document.querySelector('#adminPaneV2').innerHTML=`<button class="ghost" onclick="renderAdminCenter('employees')">← Pracownicy</button><h3>${E(e.full_name)}</h3><div class="profileFacts"><div><span>E-mail</span><b>${E(e.email||p?.email||'Brak')}</b></div><div><span>Telefon</span><b>${E(e.phone||'Brak')}</b></div><div><span>Rola konta</span><b>${E(p?.role||'Brak konta')}</b></div><div><span>Aktywność</span><b>${E(statusName(p))}</b></div><div><span>Etat</span><b>${e.contract_percent||100}%</b></div></div><div class="actions" style="margin-top:12px"><button class="primary" onclick="employeeFormById('${e.id}')">Edytuj dane</button>${p?`<button class="ghost" onclick="resetUserPassword('${p.id}')">Reset hasła</button>`:''}<button class="ghost" onclick="permissionEditor('${e.id}')">Uprawnienia</button></div>`};
 function renderRoomsInsideAdmin(){const pane=document.querySelector('#adminPaneV2');if(!pane)return;pane.innerHTML=`<div class="toolbar"><div><h3>🏛️ Sale i stoliki</h3><small>Zarządzanie bez wychodzenia z ustawień</small></div><div class="actions"><button class="ghost" onclick="roomForm()">+ Sala</button><button class="primary" onclick="tableForm()">+ Stolik</button></div></div>${(S.rooms||[]).map(r=>`<section class="roomBlock"><div class="sectionHead"><div><h3>${E(r.name)}</h3><small>do ${r.capacity||'—'} osób</small></div><button class="ghost" onclick="roomForm('${r.id}')">Edytuj</button></div><div class="tableGrid">${(S.tables||[]).filter(t=>t.room_id===r.id).map(t=>`<button class="tableAdmin" onclick="tableForm('${t.id}')"><b>${E(t.label)}</b><small>${t.seats||0} miejsc</small></button>`).join('')||'<p class="muted">Brak stolików.</p>'}</div></section>`).join('')}`}
 const oldRoom=window.roomForm,oldTable=window.tableForm;function rerouteForm(fn){return(...a)=>{fn(...a);const form=document.querySelector('#form'),prev=form.onsubmit;form.onsubmit=async e=>{await prev(e);setTimeout(()=>renderAdminCenter('places'),0)}}}if(oldRoom)window.roomForm=rerouteForm(oldRoom);if(oldTable)window.tableForm=rerouteForm(oldTable);
 renderSettings=()=>renderAdminCenter('employees');window.renderSettings=renderSettings;const st=document.querySelector('#settings');if(st)st.onclick=()=>renderAdminCenter('employees');const em=document.querySelector('#employees');if(em){em.textContent='👥 Pracownicy';em.onclick=()=>renderAdminCenter('employees')}
 const oldDashboard=renderDashboard;renderDashboard=function(){oldDashboard();setActive('dashboard');document.querySelectorAll('#content .orderCard').forEach(b=>b.addEventListener('click',()=>setActive('pos'),{once:true}));if(manage()){const f=financeSummary(),toolbar=document.querySelector('#content .toolbar');toolbar?.insertAdjacentHTML('afterend',financeHtml(f))}};window.renderDashboard=renderDashboard;
 function explicitAvailability(eid,ds){return (S.availability||[]).find(a=>(a.employee_id===eid||a.user_id===(S.employees||[]).find(e=>e.id===eid)?.profile_id)&&a.work_date===ds)}
 window.editShift=(r,ds)=>{const eligible=(S.employees||[]).filter(e=>{const a=explicitAvailability(e.id,ds);return !off(e.id,ds)&&a?.status!=='unavailable'});M(r?'Edytuj zmianę':'Dodaj zmianę',`<label>Pracownik</label><select id="ee">${eligible.map(e=>{const a=explicitAvailability(e.id,ds);return `<option value="${e.id}" ${e.id===r?.employee_id?'selected':''}>${E(e.full_name)} ${a?.status==='available'?'✓ dostępny':''}</option>`}).join('')}</select>${eligible.length?'':'<div class="conflictHint">Brak dostępnych pracowników w tym dniu.</div>'}${F('ed','Dzień','date',`value="${r?.shift_date||ds}"`)}${F('es','Od','time',`value="${r?.start_time?.slice(0,5)||'12:00'}"`)}${F('en','Do','time',`value="${r?.end_time?.slice(0,5)||'20:00'}"`)}`,async()=>{if(!eligible.length)return alert('Brak dostępnych pracowników.');const p={employee_id:document.querySelector('#ee').value,shift_date:document.querySelector('#ed').value,start_time:document.querySelector('#es').value,end_time:document.querySelector('#en').value,created_by:S.u.id},q=r?sb.from('work_shifts').update(p).eq('id',r.id):sb.from('work_shifts').upsert(p,{onConflict:'employee_id,shift_date'}),{error}=await q;if(error)return alert(error.message);document.querySelector('#dlg').close();await load();RS();toast('Grafik zapisany')})};
 window.buildProposal=()=>alert('Generator grafiku jest tymczasowo wyłączony. Grafik ustawiaj ręcznie na podstawie dyspozycyjności.');
 const oldBF=window.BF;window.BF=()=>{oldBF();const form=document.querySelector('#form'),prev=form.onsubmit;form.onsubmit=async e=>{e.preventDefault();const place=document.querySelector('#bp')?.value,a=new Date(document.querySelector('#ba')?.value),z=new Date(a.getTime()+7200000),conflict=(S.bookings||[]).find(b=>b.reservation_place_id===place&&new Date(b.start_at)<z&&new Date(b.end_at)>a);if(conflict)return alert(`To miejsce jest już zajęte od ${new Date(conflict.start_at).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})} do ${new Date(conflict.end_at).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}.`);await prev(e)}};
 const ver=document.querySelector('#appVersion');if(ver)ver.textContent='Wersja 3.4.0 CONTROL PRO';
})();
