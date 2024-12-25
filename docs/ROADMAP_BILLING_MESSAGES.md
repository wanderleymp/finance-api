# Roadmap: Billing Messages Implementation

## Overview
Implementation of billing message system to send notifications about invoices, payments, and due dates.

## Current Templates
| ID | Type | Description | Variables |
|----|------|-------------|-----------|
| 1 | Billing | New invoice notification | {{person_name}}, {{company_name}}, {{movement_description}}, {{installments}}, {{nfse_link}} |
| 2 | Due Today | Due date reminder | {{person_name}}, {{company_name}}, {{movement_description}}, {{movement_amount}}, {{movement_due_date}}, {{payment_link}} |
| 3 | First Late | First late payment notice | {{person_name}}, {{company_name}}, {{movement_description}}, {{movement_amount}}, {{movement_due_date}}, {{movement_days_late}}, {{payment_link}} |
| 4 | Second Late | Second late payment notice | Same as First Late |
| 5 | Final Notice | Final late payment notice | Same as First Late |

## Implementation Steps

### Phase 1: Templates Module
- [ ] Create templates module structure
  ```bash
  node create-module.js templates
  ```
- [ ] Implement template interfaces
  - [ ] Template interface
  - [ ] TemplateData interface
- [ ] Implement template repository
  - [ ] findByType method
  - [ ] Extend BaseRepository
- [ ] Implement template service
  - [ ] findByType method
  - [ ] processTemplate method
  - [ ] Field substitution
  - [ ] Validation

### Phase 2: Billing Messages Module
- [ ] Create billing-messages module
  ```bash
  node create-module.js billing-messages
  ```
- [ ] Implement BillingMessageService
  - [ ] processBillingMessage method
  - [ ] Template integration
  - [ ] Task creation

### Phase 3: Movement Integration
- [ ] Update MovementService
  - [ ] Add BillingMessageService integration
  - [ ] Implement trigger points
  - [ ] Add error handling

### Phase 4: Task Configuration
- [ ] Verify existing task types
- [ ] Add new task type if needed
- [ ] Configure task processor

### Phase 5: Testing
- [ ] Unit tests
  - [ ] Template processing
  - [ ] Message creation
- [ ] Integration tests
  - [ ] Full flow testing
  - [ ] Error scenarios

### Phase 6: Documentation & Deploy
- [ ] Update module documentation
- [ ] Test in staging
- [ ] Production deployment

## Database Schema

### message_templates
```sql
CREATE TABLE IF NOT EXISTS public.message_templates
(
    template_id integer NOT NULL DEFAULT nextval('message_templates_template_id_seq'::regclass),
    chat_type_id integer NOT NULL,
    template_content text COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    subject text COLLATE pg_catalog."default",
    CONSTRAINT message_templates_pkey PRIMARY KEY (template_id),
    CONSTRAINT unique_message_type_id UNIQUE (chat_type_id)
)
```

## Field Mappings
```javascript
const TEMPLATE_FIELDS = {
    // Person
    '[contactName]': '{{person_name}}',
    '[Empresa]': '{{company_name}}',
    
    // Movement
    '[Serviço/Produto]': '{{movement_description}}',
    '[Valor]': '{{movement_amount}}',
    '[due_date]': '{{movement_due_date}}',
    '[dias]': '{{movement_days_late}}',
    
    // Links
    '[Link para Pagamento]': '{{payment_link}}',
    '[linknfse]': '{{nfse_link}}',
    
    // Arrays
    '[parcelas]': '{{installments}}'
}
```

## Template Types
1. New Invoice (ID: 1)
2. Due Today (ID: 2)
3. First Late Notice (ID: 3)
4. Second Late Notice (ID: 4)
5. Final Notice (ID: 5)

## Future Enhancements (Phase 2)
1. Template CRUD operations
2. Template versioning
3. Template preview
4. A/B testing
5. Admin interface
6. Field validation
7. Change history
8. WhatsApp integration
