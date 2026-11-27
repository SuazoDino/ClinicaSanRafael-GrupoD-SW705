"""Estado del sprint a una fecha de corte: burndown real contra ideal y proyeccion."""
import csv
import sys
from datetime import date, timedelta

INICIO = date(2026, 11, 19)
FIN = date(2026, 12, 2)
TOLERANCIA = 1.0  # puntos de diferencia que aun se consideran "en ritmo"


def dias_habiles(inicio, fin):
    d = inicio
    while d <= fin:
        if d.weekday() < 5:
            yield d
        d += timedelta(days=1)


def main(ruta, corte):
    with open(ruta, newline="", encoding="utf-8") as f:
        filas = list(csv.DictReader(f))
    dias = list(dias_habiles(INICIO, FIN))
    total = sum(int(r["puntos"]) for r in filas)
    hechas = [r for r in filas if r["estado"] == "hecha"]
    print("Dia          Real  Ideal")
    transcurridos = 0
    for i, d in enumerate(dias, start=1):
        if d > corte:
            break
        transcurridos = i
        hecho = sum(int(r["puntos"]) for r in hechas if date.fromisoformat(r["fecha_fin"]) <= d)
        real = total - hecho
        ideal = total * (1 - i / len(dias))
        print(f"{d.isoformat()}  {real:>4}  {ideal:>5.1f}")
    diferencia = real - ideal
    estado = "en ritmo" if abs(diferencia) <= TOLERANCIA else ("atrasado" if diferencia > 0 else "adelantado")
    ritmo = (total - real) / transcurridos
    print(f"\nDia {transcurridos} de {len(dias)}. Comprometido: {total} pts | Hecho: {total - real} pts | Restante: {real} pts")
    print(f"Diferencia con el ideal: {diferencia:+.1f} pts -> {estado}")
    print(f"Ritmo: {ritmo:.2f} pts/dia | Proyeccion al cierre: {ritmo * len(dias):.1f} pts de {total}")


if __name__ == "__main__":
    ruta = sys.argv[1] if len(sys.argv) > 1 else "sprint2.csv"
    corte = date.fromisoformat(sys.argv[2]) if len(sys.argv) > 2 else date.today()
    main(ruta, corte)
