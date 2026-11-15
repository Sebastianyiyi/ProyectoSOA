package com.clinicamedica.app.controller;

import com.clinicamedica.app.dto.MedicoDto;
import com.clinicamedica.app.dto.ResponseDto;
import com.clinicamedica.app.entity.Paciente;
import com.clinicamedica.app.service.MedicoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/medicos")
@RequiredArgsConstructor
public class MedicoController {

    private final MedicoService medicoService;

    @GetMapping
    public ResponseEntity<List<MedicoDto>> listar(
            @RequestParam(required = false) Long especialidadId) {
        return ResponseEntity.ok(medicoService.listar(especialidadId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicoDto> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(medicoService.obtener(id));
    }

    @GetMapping("/mi-perfil")
    @PreAuthorize("hasRole('MEDICO')")
    public ResponseEntity<MedicoDto> miPerfil() {
        return ResponseEntity.ok(medicoService.obtenerMiPerfil());
    }

    @GetMapping("/mis-pacientes")
    @PreAuthorize("hasRole('MEDICO')")
    public ResponseEntity<List<Paciente>> misPacientes() {
        return ResponseEntity.ok(medicoService.obtenerMisPacientes());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MedicoDto> crear(@Valid @RequestBody MedicoDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicoService.crear(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MedicoDto> actualizar(@PathVariable Long id, @Valid @RequestBody MedicoDto dto) {
        return ResponseEntity.ok(medicoService.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDto> eliminar(@PathVariable Long id) {
        medicoService.eliminar(id);
        return ResponseEntity.ok(ResponseDto.builder()
                .exito(true)
                .mensaje("Medico eliminado correctamente")
                .build());
    }
}

