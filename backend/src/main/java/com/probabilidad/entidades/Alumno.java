// src/main/java/com/probabilidad/entidades/Alumno.java
package com.probabilidad.entidades;

import java.time.LocalDateTime;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

@Entity
@Table(name = "alumnos", indexes = {
  @Index(name = "ix_alumno_sub", columnList = "keycloak_sub", unique = true),
  @Index(name = "ix_alumno_username", columnList = "username")
})
public class Alumno extends PanacheEntityBase {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(name = "keycloak_sub", nullable = false, unique = true, length = 64)
  public String keycloakSub;

  @Column(name = "username")
  public String username;

  @Column(name = "email")
  public String email;

  @Column(name = "created_at", nullable = false)
  public LocalDateTime createdAt = LocalDateTime.now();

  @Column(name = "updated_at", nullable = false)
  public LocalDateTime updatedAt = LocalDateTime.now();
}
