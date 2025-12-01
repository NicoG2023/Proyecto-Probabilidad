package com.probabilidad.dto;

import java.util.Map;

public class PracticeQuestionDto {
    public Long templateId;
    public String stemMd;
    public Map<String,Object> params;
    public String explanationMd;   // puedes decidir mostrarla sólo al final
    public PracticeAnswerMeta answerMeta;
}
