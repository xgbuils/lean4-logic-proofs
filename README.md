# Mis Demostraciones Formales en Lean 4

Repositorio dedicado a la formalización de lógica de primer orden utilizando Lean 4, acompañado de explicaciones en texto natural y notación matemática en LaTeX.

---

## 1. Demostración: Existencia a partir de Conjunción Universal

### Enunciado Matemático
Sea $\alpha$ un tipo no vacío con un elemento $a \in \alpha$. 
Dadas las propiedades $P, Q: \alpha \to \text{Prop}$, demostramos que:

$$(\forall x \in \alpha, P(x) \land Q(x)) \implies \exists x \in \alpha, P(x)$$

---

### Explicación en Texto Natural
1. **Instanciación universal:** Dado el objeto $a \in \alpha$, aplicamos la hipótesis universal $h$ sobre $a$ para deducir la conjunción $P(a) \land Q(a)$.
2. **Eliminación de la conjunción:** Desestructuramos $P(a) \land Q(a)$ mediante `rcases` para obtener la prueba individual de $P(a)$.
3. **Introducción del existencial:** Proporcionamos el testigo $a \in \alpha$ junto con su prueba $P(a)$ para satisfacer la meta $\exists x, P(x)$.

---

### Código Formal en Lean 4

``` lean
import Mathlib

example (α : Type) (P Q : α → Prop) (a : α)
(h : ∀ x, P x ∧ Q x) : ∃ x, P x := by
have hPaQa : P a ∧ Q a := h a
rcases hPaQa with ⟨hPa, hQa⟩
exact ⟨a, hPa⟩
```
