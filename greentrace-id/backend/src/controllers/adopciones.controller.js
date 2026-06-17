'use strict';

const adopcionesService = require('../services/adopciones.service');

async function adopt(req, res) {
  const { idUnico } = req.body;
  const adopcion = await adopcionesService.adoptArbol({ idUsuario: req.user.id_usuario, idUnico });
  res.status(201).json(adopcion);
}

async function listMine(req, res) {
  const adopciones = await adopcionesService.listAdopcionesByUsuario(req.user.id_usuario);
  res.status(200).json(adopciones);
}

async function unadopt(req, res) {
  const result = await adopcionesService.unadoptArbol({
    idUsuario: req.user.id_usuario,
    idAdopcion: Number(req.params.id),
  });
  res.status(200).json(result);
}

async function listAll(req, res) {
  const result = await adopcionesService.listAllAdopciones();
  res.status(200).json(result);
}

async function unadoptAdmin(req, res) {
  const result = await adopcionesService.unadoptArbolAdmin({ idAdopcion: Number(req.params.id) });
  res.status(200).json(result);
}

module.exports = { adopt, listMine, unadopt, listAll, unadoptAdmin };
