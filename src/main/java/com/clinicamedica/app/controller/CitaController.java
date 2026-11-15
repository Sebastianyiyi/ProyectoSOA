package com.clinicamedica.app.controller;

import com.clinicamedica.app.dto.CitaDto;
import com.clinicamedica.app.dto.ResponseDto;
import com.clinicamedica.app.entity.EstadoCita;
import com.clinicamedica.app.service.CitaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/citas")
@RequiredArgsConstructor
public class CitaController {

    private final CitaService citaService;

    @GetMapping
    public ResponseEntity<List<CitaDto>> listar(
            @RequestParam(required = false) String fecha,
            @RequestParam(required = false) EstadoCita estado,
            @RequestParam(required = false) Long medicoId,
            @RequestParam(required = false) Long pacienteId) {
        return ResponseEntity.ok(citaService.listar(fecha, estado, medicoId, pacienteId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CitaDto> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(citaService.obtener(id));
    }

    @PostMapping
    public ResponseEntity<CitaDto> crear(@Valid @RequestBody CitaDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(citaService.crear(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CitaDto> actualizar(@PathVariable Long id, @RequestBody CitaDto dto) {
        return ResponseEntity.ok(citaService.actualizar(id, dto));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<CitaDto> cambiarEstado(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String estadoStr = body.get("estado");
        if (estadoStr == null) {
            throw new IllegalArgumentException("El campo 'estado' es obligatorio");
        }
        EstadoCita estado = EstadoCita.valueOf(estadoStr.toUpperCase());
        return ResponseEntity.ok(citaService.cambiarEstado(id, estado));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDto> eliminar(@PathVariable Long id) {
        citaService.eliminar(id);
        return ResponseEntity.ok(ResponseDto.builder()
                .exito(true)
                .mensaje("Cita eliminada correctamente")
                .build());
    }
}

