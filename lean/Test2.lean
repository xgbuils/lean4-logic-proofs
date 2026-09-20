theorem my_first_proof
  (P Q : Prop)
  (h : P ∧ Q)
  :
  Q
:= by
  exact h.right
