// src/main/java/com/probabilidad/api/TeacherDashboardResource.java
package com.probabilidad.api.profesor;

import com.probabilidad.dto.StudentSummaryDto;
import com.probabilidad.dto.StudentQuizAttemptDto;
import com.probabilidad.dto.StudentAttemptsChartDto;
import com.probabilidad.dto.StudentPassedChartDto;
import com.probabilidad.servicios.Profesor.*;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.math.BigDecimal;
import java.util.List;

@Path("/api/teacher")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TeacherDashboardResource {

    @Inject
    TeacherDashboardService teacherDashboardService;

    // --------- YA EXISTENTES ---------

    @GET
    @Path("/students")
    @RolesAllowed({"profesor", "admin"})
    public List<StudentSummaryDto> getStudents() {
        return teacherDashboardService.getStudentsWithAttempts();
    }

    @GET
    @Path("/students/{studentId}/attempts")
    @RolesAllowed({"profesor", "admin"})
    public Response getAttemptsForStudent(@PathParam("studentId") Long studentId) {
        List<StudentQuizAttemptDto> attempts =
                teacherDashboardService.getAttemptsForStudent(studentId);
        return Response.ok(attempts).build();
    }

    // --------- NUEVOS ENDPOINTS PARA GRÁFICAS ---------

    /**
     * Top 10 estudiantes con más quices realizados.
     * Puedes ajustar el límite usando el query param ?limit=...
     */
    @GET
    @Path("/stats/top-attempts")
    @RolesAllowed({"profesor", "admin"})
    public List<StudentAttemptsChartDto> getTopStudentsByAttempts(
            @QueryParam("limit") @DefaultValue("10") int limit) {
        return teacherDashboardService.getTopStudentsByAttempts(limit);
    }

    /**
     * Top 5 estudiantes con más quices aprobados.
     * Umbral de aprobación configurable con ?minScore=...
     * Por defecto, minScore = 60.
     */
    @GET
    @Path("/stats/top-passed")
    @RolesAllowed({"profesor", "admin"})
    public List<StudentPassedChartDto> getTopStudentsByPassed(
            @QueryParam("minScore") @DefaultValue("60") BigDecimal minScore,
            @QueryParam("limit") @DefaultValue("5") int limit) {
        return teacherDashboardService.getTopStudentsByPassedQuizzes(minScore, limit);
    }
}
