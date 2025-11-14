// src/main/java/com/probabilidad/dto/StudentAttemptsChartDto.java
package com.probabilidad.dto;

public class StudentAttemptsChartDto {

    public Long studentId;
    public String username;
    public long attemptsCount;

    public StudentAttemptsChartDto(Long studentId, String username, long attemptsCount) {
        this.studentId = studentId;
        this.username = username;
        this.attemptsCount = attemptsCount;
    }
}
