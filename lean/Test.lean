theorem my_first_proof
  (P Q : Prop)
  (h : P ∧ Q)
  :
  P
:= by
  exact h.1
