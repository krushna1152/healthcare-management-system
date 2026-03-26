import tensorflow as tf

class AIModel:
    def __init__(self, model_path):
        self.model = tf.keras.models.load_model(model_path)

    def predict(self, image):
        processed_image = self.preprocess_image(image)
        return self.model.predict(processed_image)

    def preprocess_image(self, image):
        image = tf.image.resize(image, (224, 224))
        image = image / 255.0
        return tf.expand_dims(image, axis=0)

class SkinDiseaseDetection(AIModel):
    def __init__(self, model_path):
        super().__init__(model_path)

    def classify(self, image):
        predictions = self.predict(image)
        return tf.argmax(predictions, axis=1).numpy()