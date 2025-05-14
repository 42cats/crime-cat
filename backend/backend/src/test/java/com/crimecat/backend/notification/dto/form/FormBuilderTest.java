package com.crimecat.backend.notification.dto.form;

import com.crimecat.backend.notification.enums.ActionButtonType;
import com.crimecat.backend.notification.enums.NotificationType;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class FormBuilderTest {
    
    private FormBuilder formBuilder;
    private ObjectMapper objectMapper;
    
    @BeforeEach
    void setUp() {
        formBuilder = new FormBuilder();
        objectMapper = new ObjectMapper();
    }
    
    @Test
    void testBuildFormForRecordRequest() {
        // Given
        UUID notificationId = UUID.randomUUID();
        
        // When
        List<FormField> formFields = formBuilder.buildFormForNotification(NotificationType.RECORD_REQUEST, notificationId);
        
        // Then
        assertNotNull(formFields);
        assertEquals(2, formFields.size());
        
        // notificationId 숨겨진 필드 확인
        FormField hiddenField = formFields.get(0);
        assertEquals("notificationId", hiddenField.getName());
        assertEquals(notificationId.toString(), hiddenField.getDefaultValue());
        
        // responseMessage 필드 확인
        FormField messageField = formFields.get(1);
        assertEquals("responseMessage", messageField.getName());
        assertEquals("응답 메시지", messageField.getLabel());
        assertFalse(messageField.isRequired());
    }
    
    @Test
    void testBuildActionsForRecordRequest() {
        // Given
        UUID notificationId = UUID.randomUUID();
        
        // When
        List<ActionButton> actionButtons = formBuilder.buildActionsForNotification(NotificationType.RECORD_REQUEST, notificationId);
        
        // Then
        assertNotNull(actionButtons);
        assertEquals(2, actionButtons.size());
        
        // Accept 버튼 확인
        ActionButton acceptButton = actionButtons.get(0);
        assertEquals(ActionButtonType.ACCEPT, acceptButton.getType());
        assertEquals("승인", acceptButton.getLabel());
        assertTrue(acceptButton.isRequiresForm());
        
        // Decline 버튼 확인
        ActionButton declineButton = actionButtons.get(1);
        assertEquals(ActionButtonType.DECLINE, declineButton.getType());
        assertEquals("거절", declineButton.getLabel());
        assertTrue(declineButton.isRequiresForm());
    }
    
    @Test
    void testJsonSerialization() throws JsonProcessingException {
        // Given
        UUID notificationId = UUID.randomUUID();
        List<FormField> formFields = formBuilder.buildFormForNotification(NotificationType.FRIEND_REQUEST, notificationId);
        List<ActionButton> actionButtons = formBuilder.buildActionsForNotification(NotificationType.FRIEND_REQUEST, notificationId);
        
        // When
        String formFieldsJson = objectMapper.writeValueAsString(formFields);
        String actionButtonsJson = objectMapper.writeValueAsString(actionButtons);
        
        // Then
        assertNotNull(formFieldsJson);
        assertNotNull(actionButtonsJson);
        
        // JSON이 제대로 직렬화되는지 확인
        assertTrue(formFieldsJson.contains("notificationId"));
        assertTrue(formFieldsJson.contains("visibility"));
        assertTrue(actionButtonsJson.contains("accept"));
        assertTrue(actionButtonsJson.contains("decline"));
    }
}