"use strict";

/* ===================== LÓGICA (BigInt para números grandes) ===================== */
const ErrorEntrada = class extends Error {};

function entero(valor, nombre) {
  if (valor === "" || valor === null || valor === undefined || !Number.isInteger(Number(valor)))
    throw new ErrorEntrada(nombre + " debe ser un número entero.");
  const v = Number(valor);
  if (v < 0) throw new ErrorEntrada(nombre + " no puede ser negativo.");
  if (v > 5000) throw new ErrorEntrada(nombre + " es demasiado grande (máximo 5000).");
  return BigInt(v);
}

function factorial(n) {
  let r = 1n;
  for (let i = 2n; i <= n; i++) r *= i;
  return r;
}

function permutacion(n, r) {            // P(n,r) = n!/(n-r)!
  if (r > n) throw new ErrorEntrada("r no puede ser mayor que n.");
  let res = 1n;
  for (let i = 0n; i < r; i++) res *= (n - i);
  return res;
}

function permutacionRepeticion(grupos) { // n!/(n1!·n2!·…)
  if (!grupos.length) throw new ErrorEntrada("Ingrese al menos un grupo.");
  const n = grupos.reduce((a, b) => a + b, 0n);
  let den = 1n;
  grupos.forEach(g => den *= factorial(g));
  return factorial(n) / den;
}

function parsearGrupos(texto) {
  return texto.split(",").map(s => s.trim()).filter(s => s !== "")
              .map((s, i) => entero(s, "El grupo " + (i + 1)));
}

/* Calcula una operación y devuelve {formula, valor, detalle} */
function calcular(op, datos) {
  switch (op) {
    case "factorial": {
      const n = entero(datos.n, "n");
      return { formula: `${n}!`, valor: factorial(n).toString() };
    }
    case "permCirc": {
      const n = entero(datos.n, "n");
      if (n === 0n) throw new ErrorEntrada("n debe ser al menos 1.");
      return { formula: `PC(${n}) = (${n}-1)!`, valor: factorial(n - 1n).toString() };
    }
    case "permSin": {
      const n = entero(datos.n, "n");
      const r = (String(datos.r).trim() === "") ? n : entero(datos.r, "r");
      return { formula: `P(${n}, ${r}) = ${n}! / (${n}-${r})!`, valor: permutacion(n, r).toString() };
    }
    case "permRep": {
      const g = parsearGrupos(datos.grupos);
      return { formula: `${g.reduce((a, b) => a + b, 0n)}! / (${g.map(x => x + "!").join(" · ")})`,
               valor: permutacionRepeticion(g).toString() };
    }
  }
  throw new ErrorEntrada("Operación no reconocida.");
}

/* ===================== INTERFAZ ===================== */
const $ = id => document.getElementById(id);

function actualizarCampos() {
  const op = $("operacion").value;
  $("caja-grupos").classList.toggle("hidden", op !== "permRep");
  $("campos-nr").classList.toggle("hidden", op === "permRep");
  $("lbl-n").textContent = "n (total de elementos)";
  $("lbl-r").textContent = "r (elementos tomados; déjalo vacío si no aplica)";
  $("resultado").style.display = "none";
}

function mostrar(msg, esError) {
  const caja = $("resultado");
  caja.className = esError ? "error" : "";
  caja.style.display = "block";
  caja.innerHTML = msg;
}

function ejecutar() {
  try {
    const res = calcular($("operacion").value,
      { n: $("n").value, r: $("r").value, grupos: $("grupos").value });
    mostrar(`<div class="formula">${res.formula}</div>
             <div class="valor">${res.valor} ${res.detalle || ""}</div>`, false);
  } catch (e) {
    mostrar(e instanceof ErrorEntrada ? e.message : "Error inesperado: " + e.message, true);
  }
}

/* ===================== PRUEBAS (editables por el usuario) ===================== */
const CASOS_INICIALES = [1, 2, 3, 4, 5].map(() => ({ op: "permSin", n: "", r: "", esperado: "" }));

function ajustarFila(tr) {
  const op = tr.querySelector(".t-op").value;
  const n = tr.querySelector(".t-n"), r = tr.querySelector(".t-r");
  n.disabled = false; r.disabled = false;
  n.placeholder = (op === "permRep") ? "vacío si no aplica" : "";
  r.placeholder = (op === "permRep") ? "1,4,4,2" : (op === "factorial" || op === "permCirc") ? "vacío si no aplica" : "";
}

function agregarFila(c) {
  c = c || { op: "permSin", n: "", r: "", esperado: "" };
  const tr = document.createElement("tr");
  tr.innerHTML = `<td><select class="t-op">${$("operacion").innerHTML}</select></td>
    <td><input class="t-n" type="text" inputmode="numeric"></td>
    <td><input class="t-r" type="text"></td>
    <td><input class="t-e" type="text"></td>
    <td class="t-o">-</td><td class="t-s">-</td>
    <td><button type="button" class="t-x" title="Quitar caso" style="margin:0;padding:6px 10px;background:#8a3b36">X</button></td>`;
  tr.querySelector(".t-op").value = c.op;
  tr.querySelector(".t-n").value = c.n;
  tr.querySelector(".t-r").value = c.r;
  tr.querySelector(".t-e").value = c.esperado;
  tr.querySelector(".t-op").addEventListener("change", () => ajustarFila(tr));
  tr.querySelector(".t-x").addEventListener("click", () => tr.remove());
  ajustarFila(tr);
  document.querySelector("#tabla-pruebas tbody").appendChild(tr);
}

function correrPruebas() {
  let total = 0, aprobadas = 0;
  document.querySelectorAll("#tabla-pruebas tbody tr").forEach(tr => {
    const op = tr.querySelector(".t-op").value;
    const n = tr.querySelector(".t-n").value.trim();
    const r = tr.querySelector(".t-r").value.trim();
    if (n === "" && r === "" && tr.querySelector(".t-e").value.trim() === "") return;
    const esperado = tr.querySelector(".t-e").value.trim().toUpperCase() === "ERROR"
      ? "ERROR" : tr.querySelector(".t-e").value.trim();
    let obtenido;
    try { obtenido = calcular(op, { n: n, r: r, grupos: r }).valor; }
    catch (e) { obtenido = (e instanceof ErrorEntrada) ? "ERROR" : "FALLO"; }
    const paso = obtenido === esperado;
    total++; if (paso) aprobadas++;
    tr.querySelector(".t-o").textContent = obtenido;
    const est = tr.querySelector(".t-s");
    est.textContent = paso ? "Aprobada" : "Fallida";
    est.className = "t-s " + (paso ? "ok" : "mal");
  });
  document.querySelector("#resumen-pruebas strong").textContent =
    `${aprobadas} de ${total} pruebas aprobadas.`;
}

CASOS_INICIALES.forEach(agregarFila);
$("operacion").addEventListener("change", actualizarCampos);
$("btn-calcular").addEventListener("click", ejecutar);
$("btn-pruebas").addEventListener("click", correrPruebas);
$("btn-agregar").addEventListener("click", () => agregarFila());
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.tagName === "INPUT") ejecutar(); });
actualizarCampos();
