// src/main/java/com/probabilidad/dto/StudentPassedChartDto.java
package com.probabilidad.dto;

public class StudentPassedChartDto {

    public Long studentId;
    public String username;
    public long passedCount;

    public StudentPassedChartDto(Long studentId, String username, long passedCount) {
        this.studentId = studentId;
        this.username = username;
        this.passedCount = passedCount;
    }
}
