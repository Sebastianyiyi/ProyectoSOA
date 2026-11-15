package com.clinicamedica.app.service;

import com.clinicamedica.app.config.JwtUtils;
import com.clinicamedica.app.dto.LoginDto;
import com.clinicamedica.app.dto.RegistroDto;
import com.clinicamedica.app.dto.ResponseDto;
import com.clinicamedica.app.entity.Paciente;
import com.clinicamedica.app.entity.Rol;
import com.clinicamedica.app.entity.Usuario;
import com.clinicamedica.app.repository.PacienteRepository;
import com.clinicamedica.app.repository.RolRepository;
import com.clinicamedica.app.repository.UsuarioRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;

@Service
public class AuthService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PacienteRepository pacienteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    public AuthService(UsuarioRepository usuarioRepository,
                       RolRepository rolRepository,
                       PacienteRepository pacienteRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils,
                       @Lazy AuthenticationManager authenticationManager) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.pacienteRepository = pacienteRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con email: " + email));

        Set<GrantedAuthority> authorities = new HashSet<>();
        for (Rol rol : usuario.getRoles()) {
            authorities.add(new SimpleGrantedAuthority(rol.getNombre()));
        }

        return User.withUsername(usuario.getEmail())
                .password(usuario.getPassword())
                .authorities(authorities)
                .disabled(!Boolean.TRUE.equals(usuario.getActivo()))
                .build();
    }

    @Transactional(readOnly = true)
    public ResponseDto login(LoginDto dto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword()));

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtUtils.generateToken(userDetails);

        // Detectar rol principal
        String rol = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(r -> r.equals("ROLE_ADMIN"))
                .findFirst()
                .orElseGet(() -> userDetails.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .filter(r -> r.equals("ROLE_MEDICO"))
                        .findFirst()
                        .orElse("ROLE_PACIENTE"));

        Usuario usuario = usuarioRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));

        Map<String, Object> datos = new HashMap<>();
        datos.put("email", usuario.getEmail());
        datos.put("usuarioId", usuario.getId());

        // Si es paciente o médico, adjuntar info relevante
        pacienteRepository.findByUsuarioId(usuario.getId()).ifPresent(p -> {
            datos.put("pacienteId", p.getId());
            datos.put("nombreCompleto", p.getNombre() + " " + p.getApellido());
            datos.put("cedula", p.getCedula());
        });

        return ResponseDto.builder()
                .exito(true)
                .mensaje("Inicio de sesion exitoso")
                .token(token)
                .rol(rol)
                .datos(datos)
                .build();
    }

    @Transactional
    public ResponseDto registrar(RegistroDto dto) {
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email");
        }
        if (pacienteRepository.existsByCedula(dto.getCedula())) {
            throw new IllegalArgumentException("Ya existe un paciente con esa cedula");
        }

        Rol rolPaciente = rolRepository.findByNombre("ROLE_PACIENTE")
                .orElseThrow(() -> new IllegalStateException("El rol ROLE_PACIENTE no esta configurado en el sistema"));

        Usuario usuario = Usuario.builder()
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .roles(new HashSet<>(Set.of(rolPaciente)))
                .build();
        usuario = usuarioRepository.save(usuario);

        Paciente paciente = Paciente.builder()
                .usuario(usuario)
                .cedula(dto.getCedula())
                .nombre(dto.getNombre())
                .apellido(dto.getApellido())
                .telefono(dto.getTelefono())
                .direccion(dto.getDireccion())
                .fechaNacimiento(dto.getFechaNacimiento())
                .build();
        pacienteRepository.save(paciente);

        return ResponseDto.builder()
                .exito(true)
                .mensaje("Registro completado con exito. Ya puedes iniciar sesion.")
                .rol(rolPaciente.getNombre())
                .datos(paciente.getId())
                .build();
    }

    @Transactional(readOnly = true)
    public Usuario obtenerUsuarioActual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AccessDeniedException("No hay una sesion autenticada");
        }
        return usuarioRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new NoSuchElementException("Usuario autenticado no encontrado"));
    }
}

