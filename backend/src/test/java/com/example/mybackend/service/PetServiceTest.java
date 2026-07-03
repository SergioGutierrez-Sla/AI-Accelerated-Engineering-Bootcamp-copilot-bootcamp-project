package com.example.mybackend.service;

import com.example.mybackend.domain.Pet;
import com.example.mybackend.domain.User;
import com.example.mybackend.dto.PetResponse;
import com.example.mybackend.exception.PetAccessDeniedException;
import com.example.mybackend.exception.ResourceNotFoundException;
import com.example.mybackend.repository.PetRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PetServiceTest {

    @Mock private PetRepository petRepository;

    @InjectMocks private PetService petService;

    private Pet buildPet(Long petId, Long ownerId) {
        User owner = new User("Test", "Owner", "owner@test.com", "hash", "ROLE_USER");
        ReflectionTestUtils.setField(owner, "id", ownerId);
        Pet pet = new Pet(owner, "Buddy", "Dog");
        ReflectionTestUtils.setField(pet, "id", petId);
        return pet;
    }

    @Test
    void getPetForUser_success_returnsPet() {
        Pet pet = buildPet(1L, 10L);
        when(petRepository.existsById(1L)).thenReturn(true);
        when(petRepository.findByIdAndOwnerId(1L, 10L)).thenReturn(Optional.of(pet));

        Pet result = petService.getPetForUser(1L, 10L);

        assertThat(result.getName()).isEqualTo("Buddy");
    }

    @Test
    void getPetForUser_petNotFound_throwsResourceNotFoundException() {
        when(petRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> petService.getPetForUser(99L, 10L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void getPetForUser_wrongOwner_throwsPetAccessDeniedException() {
        when(petRepository.existsById(1L)).thenReturn(true);
        when(petRepository.findByIdAndOwnerId(1L, 99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> petService.getPetForUser(1L, 99L))
                .isInstanceOf(PetAccessDeniedException.class);
    }

    @Test
    void getPetResponse_success_mapsCorrectly() {
        Pet pet = buildPet(1L, 10L);
        pet.setBreed("Labrador");
        when(petRepository.existsById(1L)).thenReturn(true);
        when(petRepository.findByIdAndOwnerId(1L, 10L)).thenReturn(Optional.of(pet));

        PetResponse response = petService.getPetResponse(1L, 10L);

        assertThat(response.name()).isEqualTo("Buddy");
        assertThat(response.species()).isEqualTo("Dog");
        assertThat(response.breed()).isEqualTo("Labrador");
    }
}
