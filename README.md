# SwasthaAI – Democratizing Healthcare with AI

## Overview

**SwasthaAI** is an AI-powered healthcare assistance platform designed to bridge the healthcare accessibility gap in India. With a focus on simplicity, personalization, and voice-first interaction, SwasthaAI helps users understand symptoms, medical reports, medications, and connect with the right healthcare professionals—especially benefiting underserved and rural populations.

---

## Problem Statement

In India, nearly **70% of the population lacks access to quality primary healthcare**.
Patients often face challenges such as:

* Difficulty understanding symptoms and when to seek medical help
* Complex medical jargon in lab reports
* Finding the right medical specialists
* Managing multiple medications and avoiding drug interactions

These barriers frequently lead to **delayed diagnoses, incorrect self-medication, and poor health outcomes**.

---

## Solution

**SwasthaAI** leverages **multi-agent AI orchestration using OnDemand** to provide end-to-end medical guidance in a user-friendly manner. The platform deploys **six specialized AI agents**, each dedicated to a core healthcare task:

### AI Agents

1. **Symptom Analyzer**

   * Performs intelligent triage based on user-reported symptoms
   * Suggests possible conditions and next steps

2. **Lab Report Interpreter**

   * Explains complex medical and lab reports in simple, easy-to-understand language

3. **Drug Interaction Checker**

   * Identifies potential conflicts between prescribed medications
   * Promotes safer medication usage

4. **Doctor Recommender**

   * Matches patients with the most suitable medical specialists based on symptoms

5. **Health Knowledge Base**

   * RAG-powered medical Q&A system
   * Built using trusted sources like *Harrison’s Principles of Internal Medicine*

6. **Appointment Scheduler**

   * Seamlessly books doctor consultations
   * Reduces friction in accessing healthcare services

---

## Technology Stack & Architecture

* **Next.js** - Frontend framework
* **Node.js** - HTTP Server
* **Python** - Microservice
* **Langchain** - AI Framework
* **OnDemand AI** – Multi-agent orchestration framework
* **Chat API** – Real-time conversational healthcare assistance
* **Media API** – Upload and analyze lab reports and medical documents
* **Custom Tools (3)** – Built for India-specific healthcare workflows
* **RAG (Retrieval-Augmented Generation)** – Reliable medical knowledge retrieval
* **ElevenLabs** – Voice-based input and audio responses

---

## Voice-First Accessibility

SwasthaAI integrates **ElevenLabs** to enable:

* Voice-based symptom input
* Audio explanations of diagnoses and reports

This ensures accessibility for **rural users and individuals with low literacy**, making healthcare guidance truly inclusive.

---

## Impact

* Expands access to reliable medical guidance for millions
* Reduces dependency on immediate physical consultations
* Improves health literacy and early diagnosis
* Empowers users with personalized, understandable healthcare insights

**SwasthaAI transforms healthcare into something accessible, intelligent, and human-centric—ensuring quality medical guidance is not a privilege, but a right.**