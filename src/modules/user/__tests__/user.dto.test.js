const CreateUserDto = require('../dto/create-user.dto');
const UpdateUserDto = require('../dto/update-user.dto');
const { ValidationError } = require('../../../utils/errors');

describe('UserDTOs', () => {
    describe('CreateUserDTO', () => {
        const validUserData = {
            username: 'testuser',
            password: 'Test@123',
            person_id: 1,
            profile_id: 1
        };

        it('should create valid DTO', () => {
            // Act
            const dto = new CreateUserDto(validUserData);

            // Assert
            expect(dto).toBeDefined();
            expect(dto.username).toBe(validUserData.username);
            expect(dto.password).toBe(validUserData.password);
            expect(dto.person_id).toBe(validUserData.person_id);
            expect(dto.profile_id).toBe(validUserData.profile_id);
        });

        it('should validate required fields', () => {
            // Arrange
            const invalidData = {
                username: 'test'
                // Missing required fields
            };

            // Act & Assert
            expect(() => new CreateUserDto(invalidData))
                .toThrow(ValidationError);
        });

        it('should validate username format', () => {
            // Arrange
            const invalidData = {
                ...validUserData,
                username: 'test@invalid' // Invalid username format
            };

            // Act & Assert
            expect(() => new CreateUserDto(invalidData))
                .toThrow(ValidationError);
        });

        it('should validate password strength', () => {
            // Arrange
            const invalidData = {
                ...validUserData,
                password: 'weak' // Weak password
            };

            // Act & Assert
            expect(() => new CreateUserDto(invalidData))
                .toThrow(ValidationError);
        });

        it('should validate person_id is positive', () => {
            // Arrange
            const invalidData = {
                ...validUserData,
                person_id: -1
            };

            // Act & Assert
            expect(() => new CreateUserDto(invalidData))
                .toThrow(ValidationError);
        });

        it('should validate profile_id is positive', () => {
            // Arrange
            const invalidData = {
                ...validUserData,
                profile_id: -1
            };

            // Act & Assert
            expect(() => new CreateUserDto(invalidData))
                .toThrow(ValidationError);
        });
    });

    describe('UpdateUserDTO', () => {
        const validUpdateData = {
            username: 'newusername',
            active: true,
            enable_2fa: false
        };

        it('should create valid DTO', () => {
            // Act
            const dto = new UpdateUserDto(validUpdateData);

            // Assert
            expect(dto).toBeDefined();
            expect(dto.username).toBe(validUpdateData.username);
            expect(dto.active).toBe(validUpdateData.active);
            expect(dto.enable_2fa).toBe(validUpdateData.enable_2fa);
        });

        it('should allow partial updates', () => {
            // Arrange
            const partialData = {
                username: 'newusername'
            };

            // Act
            const dto = new UpdateUserDto(partialData);

            // Assert
            expect(dto).toBeDefined();
            expect(dto.username).toBe(partialData.username);
            expect(dto.active).toBeUndefined();
            expect(dto.enable_2fa).toBeUndefined();
        });

        it('should validate username format if provided', () => {
            // Arrange
            const invalidData = {
                username: 'test@invalid' // Invalid username format
            };

            // Act & Assert
            expect(() => new UpdateUserDto(invalidData))
                .toThrow(ValidationError);
        });

        it('should validate boolean fields', () => {
            // Arrange
            const invalidData = {
                active: 'not-boolean',
                enable_2fa: 'not-boolean'
            };

            // Act & Assert
            expect(() => new UpdateUserDto(invalidData))
                .toThrow(ValidationError);
        });

        it('should not allow password update', () => {
            // Arrange
            const invalidData = {
                password: 'NewPass@123'
            };

            // Act & Assert
            expect(() => new UpdateUserDto(invalidData))
                .toThrow(ValidationError);
        });

        it('should not allow updating sensitive fields', () => {
            // Arrange
            const invalidData = {
                refresh_token: 'some-token',
                created_at: new Date()
            };

            // Act & Assert
            expect(() => new UpdateUserDto(invalidData))
                .toThrow(ValidationError);
        });
    });
});
