package com.clinicamedica.app.config;

import com.clinicamedica.app.dto.ResponseDto;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResponseDto> handleValidation(MethodArgumentNotValidException ex) {
        String mensaje = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return response(HttpStatus.BAD_REQUEST, mensaje);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ResponseDto> handleConstraintViolation(ConstraintViolationException ex) {
        return response(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ResponseDto> handleUnreadableMessage(HttpMessageNotReadableException ex) {
        return response(HttpStatus.BAD_REQUEST, "El cuerpo de la solicitud no es valido o contiene datos incorrectos");
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ResponseDto> handleNotFound(NoSuchElementException ex) {
        return response(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ResponseDto> handleBadRequest(IllegalArgumentException ex) {
        return response(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ResponseDto> handleIllegalState(IllegalStateException ex) {
        return response(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ResponseDto> handleAuthentication(AuthenticationException ex) {
        return response(HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ResponseDto> handleAccessDenied(AccessDeniedException ex) {
        return response(HttpStatus.FORBIDDEN, ex.getMessage() != null ? ex.getMessage() : "Acceso denegado");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ResponseDto> handleDataIntegrity(DataIntegrityViolationException ex) {
        return response(HttpStatus.CONFLICT, "No se pudo completar la operacion por una restriccion de integridad de datos");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseDto> handleGeneric(Exception ex) {
        log.error("Error no controlado", ex);
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrio un error interno en el servidor");
    }

    private ResponseEntity<ResponseDto> response(HttpStatus status, String mensaje) {
        ResponseDto body = ResponseDto.builder()
                .exito(false)
                .mensaje(mensaje)
                .build();
        return ResponseEntity.status(status).body(body);
    }
}

