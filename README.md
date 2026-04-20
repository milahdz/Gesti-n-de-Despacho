# 📦 Sistema de Gestión de Despacho de Insumos de Oficina

Sistema web diseñado para gestionar solicitudes, control de inventario y despacho de insumos dentro de una organización, optimizando los procesos administrativos y mejorando la trazabilidad de los recursos.

---

## 🎯 Objetivo

Facilitar la gestión de materiales de oficina mediante un sistema centralizado que permita controlar solicitudes, aprobaciones y despachos de forma eficiente.

---

## ⚙️ Funcionalidades

* 📄 Creación de solicitudes de insumos
* 🔄 Gestión de estados (pendiente, aprobado, rechazado, despachado)
* 📦 Registro de despachos
* 📊 Control de inventario (stock actual y mínimo)
* 👥 Gestión de usuarios por departamento
* 🛡️ Sistema de roles (Administrador, Solicitante, Almacén)

---

## 🏗️ Tecnologías utilizadas

* **Base de datos:** Supabase (PostgreSQL)
* **Frontend:** Interfaz basada en diseño en Figma
* **Control de versiones:** Git y GitHub

---

## 🧠 Estructura del sistema

El sistema está basado en un modelo relacional con las siguientes entidades:

* Usuarios
* Roles
* Departamentos
* Productos
* Solicitudes
* SolicitudDetalle
* Despachos
* DespachoDetalle

---

## 🔄 Flujo del sistema

1. El usuario crea una solicitud de insumos
2. La solicitud pasa a estado pendiente
3. El administrador aprueba o rechaza
4. Si es aprobada, el área de almacén realiza el despacho
5. Se actualiza el inventario automáticamente

---

## 🛡️ Control de acceso

* **Administrador:** acceso total al sistema
* **Solicitante:** crea y consulta sus solicitudes
* **Almacén:** gestiona despachos

---

## 🚀 Estado del proyecto

🟡 En desarrollo
Actualmente cuenta con la base de datos estructurada, usuarios creados y lógica definida.

---

## 🔐 Seguridad (próximamente)

* Implementación de login
* Hashing de contraseñas con bcrypt
* Control de acceso por roles
