// src/main/java/com/probabilidad/dto/StudentSummaryDto.java
package com.probabilidad.dto;

import java.time.LocalDateTime;

public class StudentSummaryDto {

    public Long id;
    public String username;
    public String email;
    public long attemptsCount;
    public LocalDateTime lastAttemptAt;
    public Double avgScore; // promedio de score (0-100)

    public StudentSummaryDto(Long id,
                             String username,
                             String email,
                             long attemptsCount,
                             LocalDateTime lastAttemptAt,
                             Double avgScore) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.attemptsCount = attemptsCount;
        this.lastAttemptAt = lastAttemptAt;
        this.avgScore = avgScore;
    }
}
