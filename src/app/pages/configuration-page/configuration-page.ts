import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService, BaseConfiguration } from '../../services/firebase';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-configuration-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './configuration-page.html',
  styleUrl: './configuration-page.scss'
})
export class ConfigurationPage implements OnInit, OnDestroy {
  configuration: BaseConfiguration | null = null;
  loading = true;
  saving = false;
  error = '';
  firebaseConnected = false;
  firebaseStatus = 'Checking connection...';

  // Form values
  lettuceScore = 1;
  carrotScore = 3;
  playScore = 2;
  rewardScore = 1;

  private subscription = new Subscription();

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): Promise<void> {
    this.checkFirebaseConnection();
    this.loadConfiguration();
    return Promise.resolve();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async checkFirebaseConnection(): Promise<void> {
    try {
      this.firebaseStatus = 'Testing connection...';

      // Try to get the base configuration to test the connection
      this.subscription.add(
        this.firebaseService.getBaseConfiguration().subscribe({
          next: () => {
            this.firebaseConnected = true;
            this.firebaseStatus = 'Connected to Firebase';
          },
          error: (error) => {
            console.error('Firebase connection error:', error);
            this.firebaseConnected = false;
            this.firebaseStatus = 'Connection failed';
          }
        })
      );
    } catch (error) {
      console.error('Firebase connection error:', error);
      this.firebaseConnected = false;
      this.firebaseStatus = 'Connection failed';
    }
  }

  loadConfiguration(): void {
    try {
      this.loading = true;
      this.subscription.add(
        this.firebaseService.getBaseConfiguration().subscribe({
          next: (config) => {
            this.configuration = config;

            // Update form values
            this.lettuceScore = this.configuration.meals.lettuce;
            this.carrotScore = this.configuration.meals.carrot;
            this.playScore = this.configuration.playScore;
            this.rewardScore = this.configuration.rewardScore;
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading configuration:', error);
            this.error = 'Failed to load configuration';
            this.loading = false;
          }
        })
      );
    } catch (error) {
      console.error('Error loading configuration:', error);
      this.error = 'Failed to load configuration';
      this.loading = false;
    }
  }

  saveConfiguration(): void {
    try {
      this.saving = true;
      this.error = '';

      const updatedConfig: Partial<BaseConfiguration> = {
        meals: {
          lettuce: this.lettuceScore,
          carrot: this.carrotScore
        },
        playScore: this.playScore,
        rewardScore: this.rewardScore
      };

      this.subscription.add(
        this.firebaseService.updateBaseConfiguration(updatedConfig).subscribe({
          next: () => {
            // Reload to get the updated configuration
            this.loadConfiguration();
            console.log('Configuration saved successfully!');
          },
          error: (error) => {
            console.error('Error saving configuration:', error);
            this.error = 'Failed to save configuration';
          },
          complete: () => {
            this.saving = false;
          }
        })
      );
    } catch (error) {
      console.error('Error saving configuration:', error);
      this.error = 'Failed to save configuration';
      this.saving = false;
    }
  }

  resetToDefaults(): void {
    try {
      this.saving = true;
      this.error = '';

      const defaultConfig: Partial<BaseConfiguration> = {
        rewardScore: 1,
        playScore: 2,
        meals: {
          lettuce: 1,
          carrot: 3
        },
        activities: {
          play: 2,
          petting: 1,
          grooming: 1
        }
      };

      this.subscription.add(
        this.firebaseService.updateBaseConfiguration(defaultConfig).subscribe({
          next: () => {
            // Update form values
            this.lettuceScore = defaultConfig.meals!.lettuce;
            this.carrotScore = defaultConfig.meals!.carrot;
            this.playScore = defaultConfig.playScore!;
            this.rewardScore = defaultConfig.rewardScore!;

            // Reload configuration
            this.loadConfiguration();
            console.log('Configuration reset to defaults!');
          },
          error: (error) => {
            console.error('Error resetting configuration:', error);
            this.error = 'Failed to reset configuration';
          },
          complete: () => {
            this.saving = false;
          }
        })
      );
    } catch (error) {
      console.error('Error resetting configuration:', error);
      this.error = 'Failed to reset configuration';
      this.saving = false;
    }
  }
}
