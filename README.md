# Lean 4 Logic Proofs

Este proyecto contiene demostraciones formales de Lógica de Primer Orden escritas en **Lean 4**, junto con un pipeline automatizado en **Node.js** que consulta al kernel de Lean para generar documentación explicativa en **Markdown con LaTeX** para GitHub.

---

## 📋 Requisitos del Sistema

Para poder ejecutar el proyecto en tu máquina solo necesitas dos herramientas instaladas globalmente:

1. **[Node.js](https://nodejs.org/)** (versión 18.x o superior)
2. **[Lean 4](https://lean-lang.org/install/manual/)** (el binario `lean` debe estar accesible en el `PATH` de tu sistema)

> **Nota sobre dependencias:** No se requieren librerías externas pesadas de Python ni paquetes globales adicionales. Toda la manipulación de archivos y ejecución del compilador se gestiona desde el entorno de Node.js mediante el `package.json`.

---

## 🚀 Instalación y Uso

### 1. Clonar el repositorio
```bash
git clone [https://github.com/tu-usuario/lean4-logic-proofs.git](https://github.com/tu-usuario/lean4-logic-proofs.git)
cd lean4-logic-proofs