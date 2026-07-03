package com.example.mybackend.web;

import com.example.mybackend.dto.PetResponse;
import com.example.mybackend.security.SecurityUtils;
import com.example.mybackend.service.PetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pets")
public class PetController {

    private final PetService petService;

    public PetController(PetService petService) {
        this.petService = petService;
    }

    @GetMapping("/{petId}")
    public ResponseEntity<PetResponse> getPet(@PathVariable Long petId) {
        Long userId = SecurityUtils.getAuthenticatedUserId();
        return ResponseEntity.ok(petService.getPetResponse(petId, userId));
    }
}
